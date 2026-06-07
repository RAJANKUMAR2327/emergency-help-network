const express = require('express');
const router = express.Router();
const { analyzeText, analyzeImage, uploadEmergencyPhoto } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { upload } = require('../services/uploadService');

router.post('/analyze-text', protect, analyzeText);
router.post('/analyze-image', protect, upload.single('image'), analyzeImage);
router.post('/emergency/:emergencyId/photo', protect, upload.single('photo'), uploadEmergencyPhoto);

module.exports = router;