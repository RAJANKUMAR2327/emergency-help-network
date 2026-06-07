const fs = require('fs');
const path = require('path');
const files = {};

// AI PANIC DETECTION SERVICE
files['src/services/aiService.js'] = `
const { GoogleGenerativeAI } = require('@google/generative-ai');

const getAI = () => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'placeholder') return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

const PANIC_KEYWORDS = [
  'help', 'accident', 'bleeding', 'fire', 'attack', 'dying', 'hurt',
  'emergency', 'danger', 'crash', 'unconscious', 'blood', 'pain',
  'bachao', 'madad', 'aag', 'khoon', 'dard', 'bachana', 'help karo',
];

const detectPanicFromText = async (text) => {
  const lowerText = text.toLowerCase();
  const keywordMatches = PANIC_KEYWORDS.filter((k) => lowerText.includes(k));
  const keywordScore = Math.min(keywordMatches.length / 3, 1);

  let aiScore = 0;
  let aiAnalysis = null;
  const ai = getAI();

  if (ai && text.length > 5) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = 'Analyze if this message indicates an emergency or panic situation. Reply with JSON only: {"isPanic": true/false, "confidence": 0-1, "emergencyType": "medical/accident/fire/crime/other/none", "severity": "critical/high/medium/low/none", "reason": "brief explanation"}. Message: "' + text + '"';
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const clean = response.replace(/\`\`\`json|\`\`\`/g, '').trim();
      aiAnalysis = JSON.parse(clean);
      aiScore = aiAnalysis.confidence || 0;
    } catch (e) {
      console.warn('AI analysis failed, using keyword detection:', e.message);
    }
  }

  const finalScore = ai ? (keywordScore * 0.3 + aiScore * 0.7) : keywordScore;

  return {
    isPanic: finalScore > 0.4 || keywordMatches.length >= 2,
    confidence: finalScore,
    keywordMatches,
    emergencyType: aiAnalysis?.emergencyType || (keywordMatches.length > 0 ? 'other' : 'none'),
    severity: aiAnalysis?.severity || (keywordMatches.length >= 3 ? 'critical' : keywordMatches.length >= 2 ? 'high' : 'medium'),
    reason: aiAnalysis?.reason || ('Detected keywords: ' + keywordMatches.join(', ')),
    method: ai ? 'ai+keywords' : 'keywords',
  };
};

const classifyEmergencyFromImage = async (base64Image, mimeType) => {
  const ai = getAI();
  if (!ai) return { success: false, reason: 'AI not configured' };
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = 'Analyze this emergency scene image. Reply with JSON only: {"emergencyType": "medical/accident/fire/crime/other", "severity": "critical/high/medium/low", "description": "brief description", "immediateActions": ["action1", "action2"]}';
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } },
    ]);
    const response = result.response.text();
    const clean = response.replace(/\`\`\`json|\`\`\`/g, '').trim();
    return { success: true, analysis: JSON.parse(clean) };
  } catch (e) {
    return { success: false, reason: e.message };
  }
};

module.exports = { detectPanicFromText, classifyEmergencyFromImage };
`;

// PHOTO UPLOAD SERVICE
files['src/services/uploadService.js'] = `
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'emergency-' + unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images are allowed'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = { upload };
`;

// AI CONTROLLER
files['src/controllers/aiController.js'] = `
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
`;

// AI ROUTES
files['src/routes/ai.js'] = `
const express = require('express');
const router = express.Router();
const { analyzeText, analyzeImage, uploadEmergencyPhoto } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { upload } = require('../services/uploadService');

router.post('/analyze-text', protect, analyzeText);
router.post('/analyze-image', protect, upload.single('image'), analyzeImage);
router.post('/emergency/:emergencyId/photo', protect, upload.single('photo'), uploadEmergencyPhoto);

module.exports = router;
`;

// HOSPITAL MODEL
files['src/models/Hospital.js'] = `
const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  specialties: [{ type: String }],
  totalBeds: { type: Number, default: 0 },
  availableBeds: { type: Number, default: 0 },
  icuBeds: { type: Number, default: 0 },
  availableIcuBeds: { type: Number, default: 0 },
  hasBloodBank: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  emergencyContact: { type: String },
}, { timestamps: true });

hospitalSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Hospital', hospitalSchema);
`;

// HOSPITAL CONTROLLER
files['src/controllers/hospitalController.js'] = `
const Hospital = require('../models/Hospital');

exports.getNearbyHospitals = async (req, res) => {
  try {
    const { longitude, latitude, radius = 10000 } = req.query;
    if (!longitude || !latitude) return res.status(400).json({ success: false, message: 'Location required' });
    const hospitals = await Hospital.find({
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(radius),
        },
      },
    }).limit(10);
    res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: true });
    res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createHospital = async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body);
    res.status(201).json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBedAvailability = async (req, res) => {
  try {
    const { availableBeds, availableIcuBeds } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { availableBeds, availableIcuBeds },
      { new: true }
    );
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
    const io = req.app.get('io');
    if (io) io.emit('hospital_beds_updated', { hospitalId: hospital._id, availableBeds, availableIcuBeds });
    res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedPatnaHospitals = async (req, res) => {
  try {
    await Hospital.deleteMany({});
    const hospitals = [
      { name: 'AIIMS Patna', phone: '0612-2451070', address: 'Phulwarisharif, Patna, Bihar 801507', location: { type: 'Point', coordinates: [85.0601, 25.5478] }, specialties: ['Cardiology','Neurology','Trauma','ICU'], totalBeds: 960, availableBeds: 120, icuBeds: 80, availableIcuBeds: 15, hasBloodBank: true, emergencyContact: '0612-2451070' },
      { name: 'PMCH Patna', phone: '0612-2300629', address: 'Ashok Rajpath, Patna, Bihar 800004', location: { type: 'Point', coordinates: [85.1376, 25.6063] }, specialties: ['General','Surgery','Pediatrics','Burns'], totalBeds: 1700, availableBeds: 200, icuBeds: 60, availableIcuBeds: 8, hasBloodBank: true, emergencyContact: '0612-2300629' },
      { name: 'Paras HMRI Hospital', phone: '0612-3540100', address: 'Raja Bazaar, Patna, Bihar 800014', location: { type: 'Point', coordinates: [85.1336, 25.6028] }, specialties: ['Cardiology','Orthopedics','Neurology'], totalBeds: 350, availableBeds: 45, icuBeds: 30, availableIcuBeds: 6, hasBloodBank: true, emergencyContact: '0612-3540100' },
      { name: 'Ruban Memorial Hospital', phone: '0612-2522333', address: 'Boring Road, Patna, Bihar 800001', location: { type: 'Point', coordinates: [85.1200, 25.6095] }, specialties: ['Maternity','Pediatrics','General'], totalBeds: 200, availableBeds: 30, icuBeds: 20, availableIcuBeds: 4, hasBloodBank: false, emergencyContact: '0612-2522333' },
      { name: 'Nalanda Medical College', phone: '0612-2281121', address: 'Kankarbagh, Patna, Bihar 800020', location: { type: 'Point', coordinates: [85.1550, 25.5950] }, specialties: ['General','Surgery','Trauma'], totalBeds: 750, availableBeds: 90, icuBeds: 40, availableIcuBeds: 10, hasBloodBank: true, emergencyContact: '0612-2281121' },
    ];
    await Hospital.insertMany(hospitals);
    res.status(201).json({ success: true, message: '5 Patna hospitals seeded', count: hospitals.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
`;

// HOSPITAL ROUTES
files['src/routes/hospital.js'] = `
const express = require('express');
const router = express.Router();
const { getNearbyHospitals, getAllHospitals, createHospital, updateBedAvailability, seedPatnaHospitals } = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/nearby', protect, getNearbyHospitals);
router.get('/', protect, getAllHospitals);
router.post('/seed', seedPatnaHospitals);
router.post('/', protect, authorize('admin'), createHospital);
router.put('/:id/beds', protect, updateBedAvailability);

module.exports = router;
`;

// Write all files
let count = 0;
for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log('Written:', filePath, '(' + fs.statSync(fullPath).size + ' bytes)');
  count++;
}
console.log('\nAll ' + count + ' files written!');