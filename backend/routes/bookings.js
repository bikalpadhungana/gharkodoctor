const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getProviderBookings,
  getBooking,
  updateBookingStatus,
  assignProvider
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('patient'), createBooking);
router.get('/my', protect, authorize('patient'), getMyBookings);
router.get('/provider/my', protect, authorize('provider'), getProviderBookings);
router.get('/:id', protect, getBooking);
router.patch('/:id/status', protect, authorize('patient', 'provider', 'admin'), updateBookingStatus);
router.patch('/:id/assign', protect, authorize('admin'), assignProvider);

module.exports = router;
