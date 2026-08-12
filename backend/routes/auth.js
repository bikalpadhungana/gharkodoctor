const express = require('express');
const router = express.Router();
const { registerPatient, registerProvider, login, adminLogin, getMe, updatePatientProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register/patient', registerPatient);
router.post('/register/provider', registerProvider);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updatePatientProfile);

module.exports = router;
