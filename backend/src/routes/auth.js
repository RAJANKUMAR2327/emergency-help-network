const express = require('express');
const router = express.Router();
const { register, login, getMe, updateFCMToken, updateLocation } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/fcm-token', protect, updateFCMToken);
router.put('/location', protect, updateLocation);

module.exports = router;