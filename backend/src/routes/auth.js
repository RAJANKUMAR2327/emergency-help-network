const express = require('express');
const router = express.Router();
const { register, login, getMe, updateFCMToken, updateLocation, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, validateLocation, validateProfileUpdate } = require('../middleware/validate');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);
router.put('/fcm-token', protect, updateFCMToken);
router.put('/location', protect, validateLocation, updateLocation);
router.put('/profile', protect, validateProfileUpdate, updateProfile);

module.exports = router;
