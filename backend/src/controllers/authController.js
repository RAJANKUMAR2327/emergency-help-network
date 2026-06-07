const jwt = require('jsonwebtoken');
const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({ success: true, token, data: user });
};

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role, bloodGroup, medicalInfo } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ success: false, message: 'Name, phone and password required' });
    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ success: false, message: 'Phone already registered' });
    const user = await User.create({ name, phone, email, password, role: role || 'user', bloodGroup, medicalInfo });
    await EmergencyContact.create({ user: user._id, contacts: [] });
    sendToken(user, 201, res);
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ success: false, message: 'Phone and password required' });
    const user = await User.findOne({ phone }).select('+password');
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    sendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

exports.updateFCMToken = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.fcmToken });
    res.status(200).json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    if (!longitude || !latitude) return res.status(400).json({ success: false, message: 'longitude and latitude required' });
    await User.findByIdAndUpdate(req.user._id, { location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] } });
    res.status(200).json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};