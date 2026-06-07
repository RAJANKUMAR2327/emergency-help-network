const { detectPanicFromText, classifyEmergencyFromImage } = require('../services/aiService');
const fs = require('fs');

exports.analyzeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });
    const result = await detectPanicFromText(text);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.analyzeImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image is required' });
    const imageData = fs.readFileSync(req.file.path);
    const base64 = imageData.toString('base64');
    const result = await classifyEmergencyFromImage(base64, req.file.mimetype);
    fs.unlinkSync(req.file.path);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadEmergencyPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Photo is required' });
    const Emergency = require('../models/Emergency');
    const emergency = await Emergency.findById(req.params.emergencyId);
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found' });
    const photoUrl = '/uploads/' + req.file.filename;
    emergency.photos.push(photoUrl);
    await emergency.save();
    res.status(200).json({ success: true, photoUrl, message: 'Photo uploaded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};