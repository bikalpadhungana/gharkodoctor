const express = require('express');
const router = express.Router();
const {
  getAvailableProviders,
  getProvider,
  updateProfile,
  updateAvailability
} = require('../controllers/providerController');
const { protect, authorize } = require('../middleware/auth');

router.get('/available', getAvailableProviders);
router.get('/:id', getProvider);
router.patch('/profile', protect, authorize('provider'), updateProfile);
router.patch('/availability', protect, authorize('provider'), updateAvailability);

module.exports = router;
