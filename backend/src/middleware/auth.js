const express = require('express');
const router = express.Router();
const { register, login, getMe, updateFCMToken, updateLocation, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/fcm-token', protect, updateFCMToken);
router.put('/location', protect, updateLocation);
router.put('/profile', protect, updateProfile);  // NEW

module.exports = router;
