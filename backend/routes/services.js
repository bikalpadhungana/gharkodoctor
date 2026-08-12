const ServiceType = require('../models/ServiceType');

// Public route for listing active service types
const express = require('express');
const router = express.Router();

// @desc    Get all active service types (public)
// @route   GET /api/services
router.get('/', async (req, res, next) => {
  try {
    const serviceTypes = await ServiceType.find({ isActive: true }).sort('sortOrder');
    res.json({ success: true, serviceTypes });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single service type
// @route   GET /api/services/:id
router.get('/:id', async (req, res, next) => {
  try {
    const serviceType = await ServiceType.findById(req.params.id);
    if (!serviceType) {
      return res.status(404).json({ success: false, message: 'सेवा प्रकार फेला परेन' });
    }
    res.json({ success: true, serviceType });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
