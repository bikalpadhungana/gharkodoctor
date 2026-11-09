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
  getAuditLogs,
  triggerFlapMainDevice,
  getFlapMainTriggerStatus,
  lookupFlapMainTag
} = require('../controllers/adminController');
const { protect, authorize, STAFF_ROLES, ADMIN_ROLES } = require('../middleware/auth');

// All admin routes require staff auth.
router.use(protect, authorize(...STAFF_ROLES));
// Dispatchers take phone bookings, assign providers and confirm cash payments.
// Trust decisions (provider verification), the service registry, audit and IoT tooling are admin-only.
const adminOnly = authorize(...ADMIN_ROLES);

router.get('/dashboard/stats', getDashboardStats);
router.get('/providers/pending', getPendingProviders);
router.get('/providers', getAllProviders);
router.patch('/providers/:id/verify', adminOnly, verifyProvider);
router.get('/bookings', getAllBookings);
router.post('/bookings/phone-in', createPhoneInBooking);
router.patch('/bookings/:id/payment', verifyPayment);
router.get('/users', getUsersAndAdmins);
router.patch('/users/:id/role', authorize('superadmin'), updateUserRole);
router.get('/audit-logs', adminOnly, getAuditLogs);
router.get('/service-types', getServiceTypes);
router.post('/service-types', adminOnly, createServiceType);
router.patch('/service-types/:id', adminOnly, updateServiceType);

// FlapMain IoT & Sensor Telemetry Proxy Routes
router.post('/telemetry/trigger', adminOnly, triggerFlapMainDevice);
router.post('/telemetry/status', adminOnly, getFlapMainTriggerStatus);
router.post('/telemetry/tag-lookup', adminOnly, lookupFlapMainTag);

module.exports = router;
