const fs = require('fs');

// Fix all 3 Twilio services - lazy initialization
const twilioGuard = `const twilio = require('twilio');
const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};`;

fs.writeFileSync('src/services/smsService.js', twilioGuard + `
const sendSMS = async (toPhone, message) => {
  const client = getClient();
  if (!client) return { success: false, error: 'Twilio not configured' };
  try {
    const r = await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: toPhone });
    return { success: true, sid: r.sid };
  } catch (e) { return { success: false, error: e.message }; }
};
const formatEmergencyMessage = (emergency, reporterName) => {
  const lat = emergency.location && emergency.location.coordinates && emergency.location.coordinates[1];
  const lng = emergency.location && emergency.location.coordinates && emergency.location.coordinates[0];
  return 'EMERGENCY\\n\\n' + reporterName + ' needs help!\\nMap: https://maps.google.com/?q=' + lat + ',' + lng;
};
const notifyEmergencyContacts = async (contacts, emergency, reporterName) => {
  const msg = formatEmergencyMessage(emergency, reporterName);
  const results = [];
  for (const c of contacts) {
    if (!c.notifyViaSMS) continue;
    const r = await sendSMS(c.phone, msg);
    results.push({ contact: c.name, success: r.success });
  }
  return results;
};
module.exports = { sendSMS, notifyEmergencyContacts, formatEmergencyMessage };
`, 'utf8');
console.log('smsService.js OK:', fs.statSync('src/services/smsService.js').size, 'bytes');

fs.writeFileSync('src/services/whatsappService.js', twilioGuard + `
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const sendWhatsApp = async (toPhone, message) => {
  const client = getClient();
  if (!client) return { success: false, error: 'Twilio not configured' };
  const to = toPhone.startsWith('whatsapp:') ? toPhone : 'whatsapp:' + (toPhone.startsWith('+') ? toPhone : '+' + toPhone);
  try {
    const r = await client.messages.create({ body: message, from: WHATSAPP_FROM, to });
    return { success: true, sid: r.sid };
  } catch (e) { return { success: false, error: e.message }; }
};
const formatWhatsAppMessage = (emergency, reporterName) => {
  const lat = emergency.location && emergency.location.coordinates && emergency.location.coordinates[1];
  const lng = emergency.location && emergency.location.coordinates && emergency.location.coordinates[0];
  return 'EMERGENCY ALERT\\nPerson: ' + reporterName + '\\nType: ' + emergency.type.toUpperCase() + '\\nMap: https://maps.google.com/?q=' + lat + ',' + lng;
};
const notifyViaWhatsApp = async (contacts, emergency, reporterName) => {
  const msg = formatWhatsAppMessage(emergency, reporterName);
  const results = [];
  for (const c of contacts) {
    if (!c.notifyViaWhatsApp) continue;
    const r = await sendWhatsApp(c.phone, msg);
    results.push({ contact: c.name, success: r.success });
  }
  return results;
};
module.exports = { sendWhatsApp, notifyViaWhatsApp, formatWhatsAppMessage };
`, 'utf8');
console.log('whatsappService.js OK:', fs.statSync('src/services/whatsappService.js').size, 'bytes');

fs.writeFileSync('src/services/callService.js', twilioGuard + `
const makeEmergencyCall = async (toPhone, reporterName, emergencyType, address) => {
  const client = getClient();
  if (!client) return { success: false, error: 'Twilio not configured' };
  const label = { medical: 'medical emergency', accident: 'road accident', fire: 'fire emergency', crime: 'crime', natural_disaster: 'natural disaster', other: 'emergency' }[emergencyType] || 'emergency';
  const twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi" language="en-IN">' + reporterName + ' is reporting a ' + label + ' at ' + (address || 'unknown location') + '. Please check your messages.</Say></Response>';
  try {
    const r = await client.calls.create({ twiml, to: toPhone, from: process.env.TWILIO_PHONE_NUMBER, timeout: 30 });
    return { success: true, sid: r.sid };
  } catch (e) { return { success: false, error: e.message }; }
};
const callEmergencyContacts = async (contacts, emergency, reporterName) => {
  const results = [];
  const address = emergency.location && emergency.location.address ? emergency.location.address : 'unknown';
  for (const c of contacts) {
    if (!c.notifyViaCall) continue;
    const r = await makeEmergencyCall(c.phone, reporterName, emergency.type, address);
    results.push({ contact: c.name, success: r.success });
  }
  return results;
};
module.exports = { makeEmergencyCall, callEmergencyContacts };
`, 'utf8');
console.log('callService.js OK:', fs.statSync('src/services/callService.js').size, 'bytes');

// Fix mobile files
const mobilePath = '../mobile/src';
const ngrokUrl = 'https://nutlike-mongoose-monsoon.ngrok-free.dev';

const clientPath = mobilePath + '/api/client.js';
if (fs.existsSync(clientPath)) {
  let c = fs.readFileSync(clientPath, 'utf8');
  c = c.replace(/const API_URL = '.*';/, "const API_URL = '" + ngrokUrl + "/api';");
  fs.writeFileSync(clientPath, c, 'utf8');
  console.log('mobile/api/client.js URL updated');
} else {
  console.log('WARNING: mobile/src/api/client.js not found');
}

const socketPath = mobilePath + '/context/EmergencyContext.js';
if (fs.existsSync(socketPath)) {
  let c = fs.readFileSync(socketPath, 'utf8');
  c = c.replace(/io\('.*?'/, "io('" + ngrokUrl + "'");
  fs.writeFileSync(socketPath, c, 'utf8');
  console.log('mobile/context/EmergencyContext.js URL updated');
} else {
  console.log('WARNING: mobile/src/context/EmergencyContext.js not found');
}

// Fix notification route
fs.writeFileSync('src/routes/notification.js', [
  "const express = require('express');",
  "const router = express.Router();",
  "const {",
  "  getEmergencyContacts,",
  "  addEmergencyContact,",
  "  updateEmergencyContact,",
  "  deleteEmergencyContact,",
  "  sendTestAlert,",
  "} = require('../controllers/notificationController');",
  "const { protect } = require('../middleware/auth');",
  "",
  "router.use(protect);",
  "router.get('/contacts', getEmergencyContacts);",
  "router.post('/contacts', addEmergencyContact);",
  "router.put('/contacts/:contactId', updateEmergencyContact);",
  "router.delete('/contacts/:contactId', deleteEmergencyContact);",
  "router.post('/test', sendTestAlert);",
  "",
  "module.exports = router;",
].join('\n'), 'utf8');
console.log('notification.js route OK:', fs.statSync('src/routes/notification.js').size, 'bytes');

// Fix notificationController
fs.writeFileSync('src/controllers/notificationController.js', [
  "const EmergencyContact = require('../models/EmergencyContact');",
  "const { sendSMS } = require('../services/smsService');",
  "const { sendWhatsApp } = require('../services/whatsappService');",
  "const { makeEmergencyCall } = require('../services/callService');",
  "",
  "exports.getEmergencyContacts = async (req, res, next) => {",
  "  try {",
  "    const doc = await EmergencyContact.findOne({ user: req.user._id });",
  "    res.status(200).json({ success: true, data: doc ? doc.contacts : [] });",
  "  } catch (e) { next(e); }",
  "};",
  "",
  "exports.addEmergencyContact = async (req, res, next) => {",
  "  try {",
  "    const { name, phone, relationship, notifyViaSMS, notifyViaWhatsApp, notifyViaCall } = req.body;",
  "    if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });",
  "    let doc = await EmergencyContact.findOne({ user: req.user._id });",
  "    if (!doc) doc = await EmergencyContact.create({ user: req.user._id, contacts: [] });",
  "    if (doc.contacts.length >= 5) return res.status(400).json({ success: false, message: 'Maximum 5 contacts allowed' });",
  "    doc.contacts.push({ name, phone, relationship, notifyViaSMS: notifyViaSMS !== false, notifyViaWhatsApp: notifyViaWhatsApp !== false, notifyViaCall: notifyViaCall === true });",
  "    await doc.save();",
  "    res.status(201).json({ success: true, data: doc.contacts });",
  "  } catch (e) { next(e); }",
  "};",
  "",
  "exports.updateEmergencyContact = async (req, res, next) => {",
  "  try {",
  "    const doc = await EmergencyContact.findOne({ user: req.user._id });",
  "    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });",
  "    const contact = doc.contacts.id(req.params.contactId);",
  "    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });",
  "    Object.assign(contact, req.body);",
  "    await doc.save();",
  "    res.status(200).json({ success: true, data: doc.contacts });",
  "  } catch (e) { next(e); }",
  "};",
  "",
  "exports.deleteEmergencyContact = async (req, res, next) => {",
  "  try {",
  "    const doc = await EmergencyContact.findOne({ user: req.user._id });",
  "    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });",
  "    doc.contacts = doc.contacts.filter(function(c) { return c._id.toString() !== req.params.contactId; });",
  "    await doc.save();",
  "    res.status(200).json({ success: true, data: doc.contacts });",
  "  } catch (e) { next(e); }",
  "};",
  "",
  "exports.sendTestAlert = async (req, res, next) => {",
  "  try {",
  "    const { channel, phone } = req.body;",
  "    if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });",
  "    let result;",
  "    if (channel === 'sms') {",
  "      result = await sendSMS(phone, 'Test alert from Emergency Help Network. Your account is set up correctly.');",
  "    } else if (channel === 'whatsapp') {",
  "      result = await sendWhatsApp(phone, 'Test alert from Emergency Help Network.');",
  "    } else if (channel === 'call') {",
  "      result = await makeEmergencyCall(phone, req.user.name, 'other', 'test location');",
  "    } else {",
  "      return res.status(400).json({ success: false, message: 'Invalid channel' });",
  "    }",
  "    res.status(200).json({ success: true, result });",
  "  } catch (e) { next(e); }",
  "};",
].join('\n'), 'utf8');
console.log('notificationController.js OK:', fs.statSync('src/controllers/notificationController.js').size, 'bytes');

fs.writeFileSync('src/controllers/authController.js', [
  "const jwt = require('jsonwebtoken');",
  "const User = require('../models/User');",
  "const EmergencyContact = require('../models/EmergencyContact');",
  "",
  "const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });",
  "",
  "const sendToken = (user, statusCode, res) => {",
  "  const token = signToken(user._id);",
  "  user.password = undefined;",
  "  res.status(statusCode).json({ success: true, token, data: user });",
  "};",
  "",
  "exports.register = async (req, res) => {",
  "  try {",
  "    const { name, phone, email, password, role, bloodGroup, medicalInfo } = req.body;",
  "    if (!name || !phone || !password) return res.status(400).json({ success: false, message: 'Name, phone and password required' });",
  "    const existing = await User.findOne({ phone });",
  "    if (existing) return res.status(400).json({ success: false, message: 'Phone already registered' });",
  "    const user = await User.create({ name, phone, email, password, role: role || 'user', bloodGroup, medicalInfo });",
  "    await EmergencyContact.create({ user: user._id, contacts: [] });",
  "    sendToken(user, 201, res);",
  "  } catch (error) {",
  "    console.error('Register error:', error.message);",
  "    res.status(500).json({ success: false, message: error.message });",
  "  }",
  "};",
  "",
  "exports.login = async (req, res) => {",
  "  try {",
  "    const { phone, password } = req.body;",
  "    if (!phone || !password) return res.status(400).json({ success: false, message: 'Phone and password required' });",
  "    const user = await User.findOne({ phone }).select('+password');",
  "    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ success: false, message: 'Invalid credentials' });",
  "    sendToken(user, 200, res);",
  "  } catch (error) {",
  "    console.error('Login error:', error.message);",
  "    res.status(500).json({ success: false, message: error.message });",
  "  }",
  "};",
  "",
  "exports.getMe = async (req, res) => {",
  "  res.status(200).json({ success: true, data: req.user });",
  "};",
  "",
  "exports.updateFCMToken = async (req, res) => {",
  "  try {",
  "    await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.fcmToken });",
  "    res.status(200).json({ success: true, message: 'FCM token updated' });",
  "  } catch (error) {",
  "    res.status(500).json({ success: false, message: error.message });",
  "  }",
  "};",
  "",
  "exports.updateLocation = async (req, res) => {",
  "  try {",
  "    const { longitude, latitude } = req.body;",
  "    if (!longitude || !latitude) return res.status(400).json({ success: false, message: 'longitude and latitude required' });",
  "    await User.findByIdAndUpdate(req.user._id, { location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] } });",
  "    res.status(200).json({ success: true, message: 'Location updated' });",
  "  } catch (error) {",
  "    res.status(500).json({ success: false, message: error.message });",
  "  }",
  "};",
].join('\n'), 'utf8');

fs.writeFileSync('src/routes/auth.js', [
  "const express = require('express');",
  "const router = express.Router();",
  "const { register, login, getMe, updateFCMToken, updateLocation } = require('../controllers/authController');",
  "const { protect } = require('../middleware/auth');",
  "",
  "router.post('/register', register);",
  "router.post('/login', login);",
  "router.get('/me', protect, getMe);",
  "router.put('/fcm-token', protect, updateFCMToken);",
  "router.put('/location', protect, updateLocation);",
  "",
  "module.exports = router;",
].join('\n'), 'utf8');


fs.writeFileSync('src/models/User.js', [
  "const mongoose = require('mongoose');",
  "const bcrypt = require('bcryptjs');",
  "const userSchema = new mongoose.Schema({",
  "  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },",
  "  phone: { type: String, required: [true, 'Phone is required'], unique: true },",
  "  email: { type: String, unique: true, sparse: true, lowercase: true },",
  "  password: { type: String, required: true, minlength: 6, select: false },",
  "  role: { type: String, enum: ['user','helper','hospital','police','ambulance','admin'], default: 'user' },",
  "  isVerified: { type: Boolean, default: false },",
  "  isAvailable: { type: Boolean, default: true },",
  "  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0,0] } },",
  "  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },",
  "  medicalInfo: { type: String, maxlength: 500 },",
  "  profilePhoto: { type: String },",
  "  fcmToken: { type: String },",
  "  stats: { emergenciesReported: { type: Number, default: 0 }, helpProvided: { type: Number, default: 0 }, responseRate: { type: Number, default: 100 }, averageRating: { type: Number, default: 5 } },",
  "}, { timestamps: true });",
  "userSchema.index({ location: '2dsphere' });",
  "userSchema.pre('save', async function () {",
  "  if (!this.isModified('password')) return;",
  "  this.password = await bcrypt.hash(this.password, 12);",
  "});",
  "userSchema.methods.matchPassword = async function(p) { return bcrypt.compare(p, this.password); };",
  "module.exports = mongoose.model('User', userSchema);",
].join('\n'), 'utf8');

// Update server.js with new routes
let serverContent = fs.readFileSync('src/server.js', 'utf8');
if (!serverContent.includes('aiRoutes')) {
  serverContent = serverContent.replace(
    "app.use('/api/notifications', notificationRoutes);",
    "app.use('/api/notifications', notificationRoutes);\nconst aiRoutes = require('./routes/ai');\nconst hospitalRoutes = require('./routes/hospital');\napp.use('/api/ai', aiRoutes);\napp.use('/api/hospitals', hospitalRoutes);\napp.use('/uploads', require('express').static(require('path').join(__dirname, '../uploads')));"
  );
  fs.writeFileSync('src/server.js', serverContent, 'utf8');
  console.log('server.js updated with AI and hospital routes');
}

// Fix CORS in server.js
// Fix CORS in server.js
let corsServerJs = fs.readFileSync('src/server.js', 'utf8');
corsServerJs = corsServerJs.replace(
  "app.use(cors({ origin: '*', credentials: true }));",
  "app.use(cors({ origin: true, credentials: true, methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization','ngrok-skip-browser-warning'] }));"
);
fs.writeFileSync('src/server.js', corsServerJs, 'utf8');
console.log('CORS fixed in server.js');
console.log('User.js OK');
console.log('auth route OK:', fs.statSync('src/routes/auth.js').size, 'bytes');

console.log('authController.js OK:', fs.statSync('src/controllers/authController.js').size, 'bytes');

// Add this to setup.js before the final console.log
const serverJs = [
  "require('dotenv').config();",
  "console.log('Step 1: dotenv loaded, PORT=' + process.env.PORT);",
  "const express = require('express');",
  "const http = require('http');",
  "const { Server } = require('socket.io');",
  "const cors = require('cors');",
  "const helmet = require('helmet');",
  "const morgan = require('morgan');",
  "const path = require('path');",
  "console.log('Step 2: packages loaded');",
  "const connectDB = require('./config/db');",
  "const errorHandler = require('./middleware/errorHandler');",
  "const setupSocket = require('./socket/emergencySocket');",
  "const authRoutes = require('./routes/auth');",
  "const emergencyRoutes = require('./routes/emergency');",
  "const notificationRoutes = require('./routes/notification');",
  "const aiRoutes = require('./routes/ai');",
  "const hospitalRoutes = require('./routes/hospital');",
  "console.log('Step 3: all modules loaded');",
  "const app = express();",
  "const server = http.createServer(app);",
  "const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST'], credentials: true } });",
  "setupSocket(io);",
  "app.set('io', io);",
  "app.use(helmet());",
  "app.use(cors({ origin: '*', credentials: true }));",
  "app.use(morgan('dev'));",
  "app.use(express.json({ limit: '10mb' }));",
  "app.use(express.urlencoded({ extended: true }));",
  "app.use('/uploads', express.static(path.join(__dirname, '../uploads')));",
  "app.get('/api/health', (req, res) => res.json({ success: true, message: 'Emergency Help Network API running' }));",
  "app.use('/api/auth', authRoutes);",
  "app.use('/api/emergency', emergencyRoutes);",
  "app.use('/api/notifications', notificationRoutes);",
  "app.use('/api/ai', aiRoutes);",
  "app.use('/api/hospitals', hospitalRoutes);",
  "app.use(errorHandler);",
  "console.log('Step 4: routes registered');",
  "const PORT = process.env.PORT || 5000;",
  "const start = async () => {",
  "  try {",
  "    console.log('Step 5: connecting to MongoDB...');",
  "    await connectDB();",
  "    server.listen(PORT, () => {",
  "      console.log('====================================');",
  "      console.log('Server running on port ' + PORT);",
  "      console.log('Health: http://localhost:' + PORT + '/api/health');",
  "      console.log('====================================');",
  "    });",
  "  } catch (err) {",
  "    console.error('STARTUP ERROR:', err.message);",
  "    process.exit(1);",
  "  }",
  "};",
  "start();",
].join('\n');
fs.writeFileSync('src/server.js', serverJs, 'utf8');
console.log('server.js rewritten OK:', fs.statSync('src/server.js').size, 'bytes');
console.log('\nAll done! Run: node src/server.js');