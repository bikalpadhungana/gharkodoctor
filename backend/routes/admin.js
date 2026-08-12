const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPendingProviders,
  getAllProviders,
  verifyProvider,
  getAllBookings,
  createPhoneInBooking,
  getServiceTypes,
  createServiceType,
  updateServiceType,
  verifyPayment,
  getUsersAndAdmins,
  updateUserRole,
  getAuditLogs
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin/superadmin/dispatcher auth
router.use(protect, authorize('admin', 'superadmin', 'dispatcher'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/providers/pending', getPendingProviders);
router.get('/providers', getAllProviders);
router.patch('/providers/:id/verify', verifyProvider);
router.get('/bookings', getAllBookings);
router.post('/bookings/phone-in', createPhoneInBooking);
router.patch('/bookings/:id/payment', verifyPayment);
router.get('/users', getUsersAndAdmins);
router.patch('/users/:id/role', authorize('superadmin'), updateUserRole);
router.get('/audit-logs', getAuditLogs);
router.get('/service-types', getServiceTypes);
router.post('/service-types', createServiceType);
router.patch('/service-types/:id', updateServiceType);

module.exports = router;
