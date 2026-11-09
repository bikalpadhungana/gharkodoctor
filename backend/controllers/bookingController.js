const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const ServiceType = require('../models/ServiceType');
const { sendSMS, smsTemplates } = require('../utils/smsService');
const { STAFF_ROLES } = require('../middleware/auth');

const PHONE_RE = /^\+?[0-9]{7,15}$/;
const MAX_REPORT_DOCS = 5;

// Booking state machine. Single source of truth for allowed transitions.
const VALID_TRANSITIONS = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['en_route', 'cancelled'],
  en_route: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

// Which statuses each actor may move a booking into.
const ROLE_ALLOWED_TARGETS = {
  patient: ['cancelled'],
  provider: ['confirmed', 'en_route', 'completed', 'cancelled'],
  staff: ['confirmed', 'en_route', 'completed', 'cancelled']
};

const idEq = (a, b) => Boolean(a && b) && a.toString() === b.toString();
const refId = (ref) => (ref && ref._id ? ref._id : ref);

const formatTime = (date) =>
  new Date(date).toLocaleString('ne-NP', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Kathmandu' });

const populateFull = (query) =>
  query
    .populate('serviceType')
    .populate('patient', 'name phone address ward municipality')
    .populate('provider', 'name phone rating verificationStatus isNewProvider profileImage bio')
    .populate('preferredProvider', 'name phone rating isNewProvider profileImage');

// @desc    Create a booking
// @route   POST /api/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const {
      serviceType, scheduledTime, address, ward, municipality,
      paymentMethod, notes, emergencyContact, preferredProvider
    } = req.body;

    const service = await ServiceType.findById(serviceType);
    if (!service || !service.isActive) {
      return res.status(400).json({ success: false, message: 'अमान्य सेवा प्रकार' }); // Invalid service type
    }

    const when = new Date(scheduledTime);
    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ success: false, message: 'अमान्य समय' }); // Invalid time
    }
    // Small grace window for clock skew; no bookings in the past.
    if (when.getTime() < Date.now() - 5 * 60 * 1000) {
      return res.status(400).json({ success: false, message: 'बितिसकेको समयमा बुकिङ गर्न मिल्दैन' }); // Cannot book in the past
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'ठेगाना आवश्यक छ' });
    }

    if (emergencyContact && !PHONE_RE.test(emergencyContact.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ success: false, message: 'आपतकालीन सम्पर्क नम्बर अमान्य छ' });
    }

    let preferred = null;
    if (preferredProvider) {
      preferred = await Provider.findOne({ _id: preferredProvider, verificationStatus: 'verified' });
      if (!preferred) {
        return res.status(400).json({ success: false, message: 'अमान्य वा अप्रमाणित प्रदायक' });
      }
    }

    const booking = new Booking({
      patient: req.user._id,
      serviceType,
      preferredProvider: preferred?._id || null,
      scheduledTime: when,
      address: address.trim(),
      ward,
      municipality,
      paymentMethod: ['cash', 'esewa', 'khalti'].includes(paymentMethod) ? paymentMethod : 'cash',
      notes,
      emergencyContact: emergencyContact ? emergencyContact.replace(/[\s-]/g, '') : '',
      // Price is always derived server-side; clients must never set what they pay.
      amount: service.basePriceRange?.min || 0,
      source: 'web'
    });
    booking._changedBy = `patient:${req.user._id}`;
    await booking.save();

    const populatedBooking = await populateFull(Booking.findById(booking._id));
    const serviceName = service.displayName?.ne || service.name;

    if (populatedBooking.patient?.phone) {
      sendSMS(
        populatedBooking.patient.phone,
        smsTemplates.bookingReceived(populatedBooking.patient.name, serviceName, formatTime(when))
      );
    }
    if (preferred?.phone) {
      sendSMS(preferred.phone, smsTemplates.newBookingForProvider(preferred.name, serviceName, formatTime(when)));
    }

    res.status(201).json({ success: true, booking: populatedBooking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient's bookings
// @route   GET /api/bookings/my
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ patient: req.user._id })
      .select('-visitReport.documents.fileData')
      .populate('serviceType')
      .populate('provider', 'name phone rating verificationStatus isNewProvider profileImage')
      .sort('-createdAt')
      .limit(100);

    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get provider's bookings: assigned to them, plus open requests where the patient picked them
// @route   GET /api/bookings/provider/my
exports.getProviderBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      $or: [
        { provider: req.user._id },
        { preferredProvider: req.user._id, status: 'requested', provider: null }
      ]
    })
      .select('-visitReport.documents.fileData')
      .populate('serviceType')
      .populate('patient', 'name phone address ward')
      .sort('-scheduledTime')
      .limit(200);

    // Patient phone/exact address are only revealed once the provider has accepted the visit (readme §4).
    const sanitized = bookings.map(b => {
      const obj = b.toObject();
      if (!idEq(refId(b.provider), req.user._id) && obj.patient) {
        obj.patient = { _id: obj.patient._id, name: obj.patient.name, ward: obj.patient.ward };
        obj.address = '';
        obj.emergencyContact = '';
      }
      return obj;
    });

    res.json({ success: true, count: sanitized.length, bookings: sanitized });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await populateFull(Booking.findById(req.params.id));

    if (!booking) {
      return res.status(404).json({ success: false, message: 'बुकिङ फेला परेन' });
    }

    const role = req.user.role;
    if (role === 'patient' && !idEq(refId(booking.patient), req.user._id)) {
      return res.status(403).json({ success: false, message: 'पहुँच अस्वीकृत' });
    }
    if (role === 'provider') {
      const isAssigned = idEq(refId(booking.provider), req.user._id);
      const isPreferred = idEq(refId(booking.preferredProvider), req.user._id) && booking.status === 'requested';
      // Previously any provider could read any unassigned booking (patient phone + home address).
      if (!isAssigned && !isPreferred) {
        return res.status(403).json({ success: false, message: 'पहुँच अस्वीकृत' });
      }
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (provider workflow, patient cancellation, or staff)
// @route   PATCH /api/bookings/:id/status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'बुकिङ फेला परेन' });
    }

    const role = req.user.role;
    const actor = STAFF_ROLES.includes(role) ? 'staff' : role;

    if (!ROLE_ALLOWED_TARGETS[actor]?.includes(status)) {
      return res.status(403).json({ success: false, message: 'तपाईंलाई यो परिवर्तन गर्ने अनुमति छैन' });
    }

    if (actor === 'patient') {
      if (!idEq(booking.patient, req.user._id)) {
        return res.status(403).json({ success: false, message: 'पहुँच अस्वीकृत' });
      }
      // Once the provider is on the way, cancellation goes through dispatch (phone), not a button.
      if (!['requested', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({ success: false, message: 'यो चरणमा रद्द गर्न डिस्प्याचमा फोन गर्नुहोस्' });
      }
    }

    if (actor === 'provider') {
      if (req.user.verificationStatus !== 'verified') {
        return res.status(403).json({ success: false, message: 'प्रमाणीकरण नभएसम्म बुकिङ लिन मिल्दैन' });
      }
      const isAssigned = idEq(booking.provider, req.user._id);
      const canAccept = status === 'confirmed'
        && booking.status === 'requested'
        && !booking.provider
        && idEq(booking.preferredProvider, req.user._id);
      if (!isAssigned && !canAccept) {
        return res.status(403).json({ success: false, message: 'यो बुकिङ तपाईंलाई तोकिएको छैन' });
      }
      if (canAccept) {
        booking.provider = req.user._id;
      }

      // A provider backing out of a confirmed visit must not cancel the patient's booking.
      // Release it back to the dispatch queue so someone else can be assigned.
      if (status === 'cancelled' && booking.status === 'confirmed') {
        const reason = (cancellationReason || 'Provider unavailable').toString().slice(0, 300);
        booking.provider = null;
        booking.preferredProvider = null;
        booking.status = 'requested';
        booking.notes = `${booking.notes ? `${booking.notes}\n` : ''}[Provider released: ${reason}]`;
        booking._changedBy = `provider:${req.user._id}`;
        await booking.save();

        const populated = await populateFull(Booking.findById(booking._id));
        if (populated.patient?.phone) {
          sendSMS(populated.patient.phone, smsTemplates.providerReleased(populated.patient.name));
        }
        return res.json({ success: true, released: true, booking: populated });
      }
    }

    if (!VALID_TRANSITIONS[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `'${booking.status}' बाट '${status}' मा परिवर्तन गर्न मिल्दैन`
      });
    }

    // A booking can't be confirmed without someone to send.
    if (status === 'confirmed' && !booking.provider) {
      return res.status(400).json({ success: false, message: 'पहिले प्रदायक तोक्नुहोस्' });
    }

    if (status === 'cancelled') {
      booking.cancellationReason = (cancellationReason || '').toString().slice(0, 500);
    }

    if (status === 'completed') {
      const report = req.body.visitReport || {};
      const docs = Array.isArray(report.documents) ? report.documents.slice(0, MAX_REPORT_DOCS) : [];
      booking.visitReport = {
        summary: (report.summary || '').toString().slice(0, 2000),
        vitalSigns: report.vitalSigns || {},
        completedTasks: Array.isArray(report.completedTasks) ? report.completedTasks.slice(0, 50) : [],
        documents: docs.map(d => ({
          name: (d.name || 'Medical Document').toString().slice(0, 120),
          fileData: d.fileData,
          mimeType: d.mimeType || 'image/jpeg'
        })),
        completedAt: new Date()
      };
    }

    const previousStatus = booking.status;
    booking.status = status;
    booking._changedBy = `${role}:${req.user._id}`;
    await booking.save();

    if (status === 'completed' && booking.provider && previousStatus !== 'completed') {
      const updatedProvider = await Provider.findByIdAndUpdate(
        booking.provider,
        { $inc: { completedVisits: 1 } },
        { new: true }
      );
      // findByIdAndUpdate skips save hooks, so the "new provider" flag must be cleared explicitly.
      if (updatedProvider && updatedProvider.completedVisits >= 10 && updatedProvider.isNewProvider) {
        await Provider.updateOne({ _id: updatedProvider._id }, { isNewProvider: false });
      }
    }

    const updatedBooking = await populateFull(Booking.findById(booking._id));
    const patient = updatedBooking.patient;
    const provider = updatedBooking.provider;
    const serviceName = updatedBooking.serviceType?.displayName?.ne || '';

    if (patient?.phone) {
      if (status === 'confirmed' && provider) {
        sendSMS(patient.phone, smsTemplates.providerAssigned(patient.name, provider.name, provider.phone));
      } else if (status === 'en_route' && provider) {
        sendSMS(patient.phone, smsTemplates.providerEnRoute(patient.name, provider.name));
      } else if (status === 'completed') {
        sendSMS(patient.phone, smsTemplates.bookingCompleted(patient.name));
      } else if (status === 'cancelled' && actor !== 'patient') {
        sendSMS(patient.phone, smsTemplates.bookingCancelled(patient.name, serviceName));
      }
    }
    if (status === 'cancelled' && actor !== 'provider' && provider?.phone) {
      sendSMS(provider.phone, smsTemplates.bookingCancelledForProvider(provider.name, serviceName, formatTime(updatedBooking.scheduledTime)));
    }

    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign provider to booking (staff)
// @route   PATCH /api/bookings/:id/assign
exports.assignProvider = async (req, res, next) => {
  try {
    const { providerId } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'बुकिङ फेला परेन' });
    }

    if (booking.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'यो बुकिङमा प्रदायक तोक्न मिल्दैन' });
    }

    const provider = await Provider.findById(providerId);
    if (!provider || provider.verificationStatus !== 'verified') {
      return res.status(400).json({ success: false, message: 'अमान्य वा अप्रमाणित प्रदायक' });
    }

    booking.provider = providerId;
    booking.status = 'confirmed';
    booking._changedBy = `${req.user.role}:${req.user._id}`;
    await booking.save();

    const updatedBooking = await populateFull(Booking.findById(booking._id));

    if (updatedBooking.patient?.phone) {
      sendSMS(updatedBooking.patient.phone, smsTemplates.providerAssigned(updatedBooking.patient.name, provider.name, provider.phone));
    }
    if (provider.phone) {
      sendSMS(provider.phone, smsTemplates.newBookingForProvider(provider.name, updatedBooking.serviceType?.displayName?.ne, formatTime(updatedBooking.scheduledTime)));
    }

    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};
