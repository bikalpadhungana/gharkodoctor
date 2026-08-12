const User = require('../models/User');
const Provider = require('../models/Provider');
const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/auth');

// @desc    Register a patient
// @route   POST /api/auth/register/patient
// @desc    Register a patient
// @route   POST /api/auth/register/patient
exports.registerPatient = async (req, res, next) => {
  try {
    const { name, phone, password, address, ward, municipality } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'नाम, फोन नम्बर र पासवर्ड आवश्यक छ' });
    }

    const cleanPhone = phone.toString().trim().replace(/[\s-]/g, '');

    const existingUser = await User.findOne({ phone: cleanPhone });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'यो फोन नम्बर पहिले नै दर्ता भइसकेको छ' });
    }

    const user = await User.create({
      name: name.trim(),
      phone: cleanPhone,
      password,
      address: address || '',
      ward: ward || '',
      municipality: municipality || ''
    });

    const token = generateToken(user._id, 'patient');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: 'patient',
        address: user.address,
        ward: user.ward,
        municipality: user.municipality
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a provider
// @route   POST /api/auth/register/provider
exports.registerProvider = async (req, res, next) => {
  try {
    const {
      name, phone, password, category,
      address, ward, municipality, bio,
      citizenshipId, licenseNumber, communityReference,
      serviceArea, serviceRadiusKm, locationCoords, availabilitySchedule
    } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'नाम, फोन नम्बर र पासवर्ड आवश्यक छ' });
    }

    const cleanPhone = phone.toString().trim().replace(/[\s-]/g, '');

    const existingProvider = await Provider.findOne({ phone: cleanPhone });
    if (existingProvider) {
      return res.status(400).json({ success: false, message: 'यो फोन नम्बर पहिले नै दर्ता भइसकेको छ' });
    }

    // Resolve category safely if missing
    const ServiceType = require('../models/ServiceType');
    let targetCategory = category;
    if (!targetCategory || targetCategory === '') {
      const defaultService = await ServiceType.findOne();
      targetCategory = defaultService?._id;
    }

    const provider = await Provider.create({
      name: name.trim(),
      phone: cleanPhone,
      password,
      category: targetCategory,
      address: address || '',
      ward: ward || '',
      municipality: municipality || '',
      bio: bio || '',
      verificationDocs: { citizenshipId: citizenshipId || '', licenseNumber: licenseNumber || '' },
      communityReference: communityReference || '',
      serviceArea: serviceArea || [],
      serviceRadiusKm: serviceRadiusKm || 5,
      locationCoords: locationCoords || { lat: 27.7172, lng: 85.3240 },
      availabilitySchedule: availabilitySchedule || []
    });

    const token = generateToken(provider._id, 'provider');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: provider._id,
        name: provider.name,
        phone: provider.phone,
        role: 'provider',
        verificationStatus: provider.verificationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login (patient, provider, or admin)
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const rawInput = (req.body.phone || req.body.email || '').toString().trim();
    const { password } = req.body;

    if (!rawInput || !password) {
      return res.status(400).json({ success: false, message: 'फोन नम्बर/इमेल र पासवर्ड आवश्यक छ' });
    }

    const cleanPhone = rawInput.replace(/[\s-]/g, '');
    let user = null;
    let role = 'patient';

    // 1. Check Patient User collection
    user = await User.findOne({
      $or: [{ phone: cleanPhone }, { phone: rawInput }, { email: rawInput.toLowerCase() }]
    }).select('+password');

    // 2. Check Health Provider collection
    if (!user) {
      user = await Provider.findOne({
        $or: [{ phone: cleanPhone }, { phone: rawInput }, { email: rawInput.toLowerCase() }]
      }).select('+password');
      role = 'provider';
    }

    // 3. Check Admin / SuperAdmin collection
    if (!user) {
      user = await Admin.findOne({
        $or: [{ email: rawInput.toLowerCase() }, { name: rawInput }]
      }).select('+password');
      if (user) {
        role = user.role || 'admin';
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'गलत फोन नम्बर/इमेल वा पासवर्ड' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'गलत फोन नम्बर/इमेल वा पासवर्ड' });
    }

    const token = generateToken(user._id, role);

    const userData = {
      id: user._id,
      name: user.name,
      phone: user.phone || user.email,
      email: user.email,
      role
    };

    if (role === 'provider') {
      userData.verificationStatus = user.verificationStatus;
    }

    res.json({ success: true, token, user: userData });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(admin._id, admin.role);

    res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    let user;
    const role = req.user.role;

    if (role === 'patient') {
      user = await User.findById(req.user._id);
    } else if (role === 'provider') {
      user = await Provider.findById(req.user._id).populate('category');
    } else {
      user = await Admin.findById(req.user._id);
    }

    res.json({ success: true, user: { ...user.toObject(), role } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient profile (including profileImage base64 Data URI)
// @route   PATCH /api/auth/profile
exports.updatePatientProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'email', 'address', 'ward', 'municipality', 'preferredLanguage', 'profileImage'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
