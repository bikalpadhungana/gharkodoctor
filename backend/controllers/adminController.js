const AuditLog = require('../models/AuditLog');
const Admin = require('../models/Admin');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const User = require('../models/User');
const ServiceType = require('../models/ServiceType');
const { sendSMS, smsTemplates } = require('../utils/smsService');

const logAudit = async (action, req, target = {}, details = {}) => {
  try {
    await AuditLog.create({
      action,
      performedBy: {
        id: req.user?._id,
        name: req.user?.name || req.user?.email || 'Admin',
        role: req.user?.role || 'admin'
      },
      target,
      details,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });
  } catch (err) {
    console.error('AuditLog creation failed', err);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalPatients,
      totalProviders,
      pendingVerifications,
      verifiedProviders,
      totalBookings,
      activeBookings,
      completedBookings,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      Provider.countDocuments(),
      Provider.countDocuments({ verificationStatus: 'pending' }),
      Provider.countDocuments({ verificationStatus: 'verified' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ['requested', 'confirmed', 'en_route'] } }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.aggregate([
        { $match: { status: 'completed', paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('patient', 'name phone')
      .populate('provider', 'name phone')
      .populate('serviceType', 'displayName')
      .sort('-createdAt')
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalProviders,
        pendingVerifications,
        verifiedProviders,
        totalBookings,
        activeBookings,
        completedBookings,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentBookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment of a visit booking
// @route   PATCH /api/admin/bookings/:id/payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentStatus, paymentMethod, amount, notes } = req.body;
    if (!['pending', 'paid', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('patient', 'name phone')
      .populate('provider', 'name phone')
      .populate('serviceType', 'displayName');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const oldStatus = booking.paymentStatus;
    booking.paymentStatus = paymentStatus;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (amount) booking.amount = amount;
    if (notes) booking.notes = booking.notes ? `${booking.notes}\n[Payment Note]: ${notes}` : `[Payment Note]: ${notes}`;

    await booking.save();

    await logAudit('PAYMENT_VERIFIED', req, {
      type: 'Booking',
      id: booking._id.toString(),
      label: `Booking #${booking._id.toString().slice(-6)}`
    }, {
      oldStatus,
      newStatus: paymentStatus,
      amount: booking.amount,
      paymentMethod: booking.paymentMethod
    });

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users & admins for role management
// @route   GET /api/admin/users
exports.getUsersAndAdmins = async (req, res, next) => {
  try {
    const [patients, providers, admins] = await Promise.all([
      User.find().select('-password').sort('-createdAt'),
      Provider.find().select('-password').sort('-createdAt'),
      Admin.find().select('-password').sort('-createdAt')
    ]);

    res.json({
      success: true,
      users: {
        patients,
        providers,
        admins
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Make user an admin or superadmin
// @route   PATCH /api/admin/users/:id/role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role, userType } = req.body; // userType: 'patient', 'provider', 'admin'

    if (!['admin', 'superadmin', 'dispatcher', 'patient', 'provider'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid target role' });
    }

    let targetUser;

    if (userType === 'admin' || role === 'superadmin' || role === 'admin' || role === 'dispatcher') {
      let adminAccount = await Admin.findById(req.params.id);
      if (!adminAccount && (userType === 'patient' || userType === 'provider')) {
        // Convert existing patient or provider into Admin account
        const sourceUser = userType === 'patient'
          ? await User.findById(req.params.id)
          : await Provider.findById(req.params.id);

        if (!sourceUser) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        adminAccount = await Admin.create({
          name: sourceUser.name,
          email: sourceUser.email || `${sourceUser.phone}@gharkodoctor.com`,
          password: 'admin_' + Math.random().toString(36).substring(7),
          role: role
        });
      } else if (adminAccount) {
        adminAccount.role = role;
        await adminAccount.save();
      }
      targetUser = adminAccount;
    }

    await logAudit('ROLE_UPDATED', req, {
      type: 'User',
      id: req.params.id,
      label: targetUser?.name || 'User'
    }, {
      newRole: role,
      userType
    });

    res.json({ success: true, user: targetUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort('-createdAt').limit(100);
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending provider verifications
// @route   GET /api/admin/providers/pending
exports.getPendingProviders = async (req, res, next) => {
  try {
    const providers = await Provider.find({ verificationStatus: 'pending' })
      .populate('category', 'name displayName requiredVerificationFields')
      .sort('createdAt');

    res.json({ success: true, count: providers.length, providers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all providers (admin view)
// @route   GET /api/admin/providers
exports.getAllProviders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status;

    const providers = await Provider.find(filter)
      .populate('category', 'name displayName')
      .sort('-createdAt');

    res.json({ success: true, count: providers.length, providers });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify (approve/reject) a provider
// @route   PATCH /api/admin/providers/:id/verify
exports.verifyProvider = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be verified or rejected' });
    }

    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: status,
        verificationNotes: notes || ''
      },
      { new: true }
    ).populate('category', 'name displayName');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    // Trigger SMS to provider regarding verification decision
    if (provider.phone) {
      if (status === 'verified') {
        sendSMS(provider.phone, smsTemplates.verificationApproved(provider.name));
      } else {
        sendSMS(provider.phone, smsTemplates.verificationRejected(provider.name));
      }
    }

    await logAudit('PROVIDER_VERIFIED', req, {
      type: 'Provider',
      id: provider._id.toString(),
      label: provider.name
    }, {
      status,
      notes
    });

    res.json({ success: true, provider });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (admin)
// @route   GET /api/admin/bookings
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('patient', 'name phone address')
      .populate('provider', 'name phone verificationStatus')
      .populate('serviceType', 'displayName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / limit),
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a booking on behalf of a call-in / phone patient (Dispatch)
// @route   POST /api/admin/bookings/phone-in
exports.createPhoneInBooking = async (req, res, next) => {
  try {
    const { patientName, patientPhone, serviceType, scheduledTime, address, ward, municipality, notes, amount } = req.body;

    // Find or create user by phone
    let user = await User.findOne({ phone: patientPhone });
    if (!user) {
      user = await User.create({
        name: patientName || 'Phone Customer',
        phone: patientPhone,
        password: 'phone_' + Math.random().toString(36).substring(7),
        address,
        ward,
        municipality
      });
    }

    const service = await ServiceType.findById(serviceType);
    if (!service) {
      return res.status(400).json({ success: false, message: 'Invalid service type' });
    }

    const booking = await Booking.create({
      patient: user._id,
      serviceType,
      scheduledTime: scheduledTime || new Date(),
      address,
      ward,
      municipality,
      paymentMethod: 'cash',
      notes: notes ? `[Phone Booking] ${notes}` : '[Phone-in Booking]',
      amount: amount || service.basePriceRange.min
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('serviceType')
      .populate('patient', 'name phone');

    // Trigger SMS
    sendSMS(patientPhone, smsTemplates.bookingConfirmed(user.name, service.displayName?.ne, new Date(scheduledTime).toLocaleString('ne-NP')));

    res.status(201).json({ success: true, booking: populatedBooking });
  } catch (error) {
    next(error);
  }
};

// @desc    CRUD service types
// @route   GET /api/admin/service-types
exports.getServiceTypes = async (req, res, next) => {
  try {
    const serviceTypes = await ServiceType.find().sort('sortOrder');
    res.json({ success: true, serviceTypes });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/admin/service-types
exports.createServiceType = async (req, res, next) => {
  try {
    const serviceType = await ServiceType.create(req.body);
    res.status(201).json({ success: true, serviceType });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/admin/service-types/:id
exports.updateServiceType = async (req, res, next) => {
  try {
    const serviceType = await ServiceType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!serviceType) {
      return res.status(404).json({ success: false, message: 'Service type not found' });
    }

    res.json({ success: true, serviceType });
  } catch (error) {
    next(error);
  }
};
