const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const ServiceType = require('../models/ServiceType');
const { sendSMS, smsTemplates } = require('../utils/smsService');

// @desc    Create a booking
// @route   POST /api/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const { serviceType, scheduledTime, address, ward, municipality, paymentMethod, notes, emergencyContact, amount } = req.body;

    // Verify service type exists and is active
    const service = await ServiceType.findById(serviceType);
    if (!service || !service.isActive) {
      return res.status(400).json({ success: false, message: 'अमान्य सेवा प्रकार' });
    }

    const booking = await Booking.create({
      patient: req.user._id,
      serviceType,
      scheduledTime,
      address,
      ward,
      municipality,
      paymentMethod: paymentMethod || 'cash',
      notes,
      emergencyContact,
      amount: amount || service.basePriceRange.min
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('serviceType')
      .populate('patient', 'name phone');

    // Trigger SMS to patient confirming booking request
    if (populatedBooking.patient?.phone) {
      const timeFormatted = new Date(scheduledTime).toLocaleString('ne-NP', { dateStyle: 'short', timeStyle: 'short' });
      const serviceName = service.displayName?.ne || service.name;
      sendSMS(
        populatedBooking.patient.phone,
        smsTemplates.bookingConfirmed(populatedBooking.patient.name, serviceName, timeFormatted)
      );
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
      .populate('serviceType')
      .populate('provider', 'name phone rating verificationStatus isNewProvider profileImage')
      .sort('-createdAt');

    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get provider's assigned bookings
// @route   GET /api/bookings/provider/my
exports.getProviderBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ provider: req.user._id })
      .populate('serviceType')
      .populate('patient', 'name phone address ward')
      .sort('-scheduledTime');

    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceType')
      .populate('patient', 'name phone address ward municipality')
      .populate('provider', 'name phone rating verificationStatus isNewProvider profileImage bio');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'बुकिङ फेला परेन' });
    }

    // Verify access — only patient, assigned provider, or admin
    const role = req.user.role;
    if (role === 'patient' && booking.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'पहुँच अस्वीकृत' });
    }
    if (role === 'provider' && booking.provider && booking.provider._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'पहुँच अस्वीकृत' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (by provider, patient for cancellation, or admin)
// @route   PATCH /api/bookings/:id/status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('serviceType')
      .populate('patient', 'name phone')
      .populate('provider', 'name phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'बुकिङ फेला परेन' });
    }

    const role = req.user.role;

    // Check authorization: patient can only cancel their own requested/confirmed bookings
    if (role === 'patient') {
      if (booking.patient._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'पहुँच अस्वीकृत' });
      }
      if (status !== 'cancelled') {
        return res.status(400).json({ success: false, message: 'बिरामीले बुकिङ रद्द मात्र गर्न सक्छन्' });
      }
    }

    // Validate status transitions
    const validTransitions = {
      requested: ['confirmed', 'cancelled'],
      confirmed: ['en_route', 'cancelled'],
      en_route: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `'${booking.status}' बाट '${status}' मा परिवर्तन गर्न मिल्दैन`
      });
    }

    if (status === 'cancelled' && cancellationReason) {
      booking.cancellationReason = cancellationReason;
    }

    if (req.body.visitReport) {
      booking.visitReport = {
        summary: req.body.visitReport.summary || '',
        vitalSigns: req.body.visitReport.vitalSigns || {},
        completedTasks: req.body.visitReport.completedTasks || [],
        documents: req.body.visitReport.documents || [],
        completedAt: new Date()
      };
    }

    // If completed, increment provider's completed visits
    if (status === 'completed' && booking.provider) {
      await Provider.findByIdAndUpdate(booking.provider._id, {
        $inc: { completedVisits: 1 }
      });
      if (!booking.visitReport || !booking.visitReport.completedAt) {
        booking.visitReport = booking.visitReport || {};
        booking.visitReport.completedAt = new Date();
      }
    }

    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('serviceType')
      .populate('patient', 'name phone')
      .populate('provider', 'name phone');

    // Trigger SMS alerts for status changes
    if (updatedBooking.patient?.phone) {
      if (status === 'en_route' && updatedBooking.provider) {
        sendSMS(updatedBooking.patient.phone, smsTemplates.providerEnRoute(updatedBooking.patient.name, updatedBooking.provider.name));
      } else if (status === 'completed') {
        sendSMS(updatedBooking.patient.phone, smsTemplates.bookingCompleted(updatedBooking.patient.name));
      }
    }

    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign provider to booking (by admin/dispatcher)
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
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('serviceType')
      .populate('patient', 'name phone')
      .populate('provider', 'name phone');

    // Trigger SMS to patient and provider
    if (updatedBooking.patient?.phone) {
      sendSMS(updatedBooking.patient.phone, smsTemplates.providerAssigned(updatedBooking.patient.name, provider.name, provider.phone));
    }
    if (provider.phone) {
      const timeStr = new Date(updatedBooking.scheduledTime).toLocaleString('ne-NP', { dateStyle: 'short', timeStyle: 'short' });
      sendSMS(provider.phone, smsTemplates.newBookingForProvider(provider.name, updatedBooking.serviceType?.displayName?.ne, timeStr));
    }

    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};
