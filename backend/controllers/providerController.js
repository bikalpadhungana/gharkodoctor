const Provider = require('../models/Provider');
const ServiceType = require('../models/ServiceType');

// @desc    Get available (verified) providers, optionally filtered
// @route   GET /api/providers/available
exports.getAvailableProviders = async (req, res, next) => {
  try {
    const { serviceType, ward, municipality } = req.query;

    const filter = { verificationStatus: 'verified' };

    if (serviceType) filter.category = serviceType;
    if (ward) filter.serviceArea = { $in: [ward] };

    const providers = await Provider.find(filter)
      .populate('category', 'name displayName icon')
      .select('-password -verificationDocs')
      .sort('-rating');

    res.json({ success: true, count: providers.length, providers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get provider public profile
// @route   GET /api/providers/:id
exports.getProvider = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('category', 'name displayName icon basePriceRange')
      .select('-password -verificationDocs');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'प्रदायक फेला परेन' });
    }

    res.json({ success: true, provider });
  } catch (error) {
    next(error);
  }
};

// @desc    Update provider's own profile
// @route   PATCH /api/providers/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'phone', 'email', 'bio', 'address', 'ward', 'municipality',
      'profileImage', 'serviceArea', 'serviceRadiusKm', 'locationCoords',
      'communityReference'
    ];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const provider = await Provider.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).populate('category').select('-password');

    res.json({ success: true, provider });
  } catch (error) {
    next(error);
  }
};

// @desc    Update provider's availability schedule
// @route   PATCH /api/providers/availability
exports.updateAvailability = async (req, res, next) => {
  try {
    const { availabilitySchedule, serviceArea, serviceRadiusKm, locationCoords } = req.body;
    const updates = {};

    if (availabilitySchedule) updates.availabilitySchedule = availabilitySchedule;
    if (serviceArea) updates.serviceArea = serviceArea;
    if (serviceRadiusKm) updates.serviceRadiusKm = serviceRadiusKm;
    if (locationCoords) updates.locationCoords = locationCoords;

    const provider = await Provider.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).populate('category').select('-password');

    res.json({ success: true, provider });
  } catch (error) {
    next(error);
  }
};
