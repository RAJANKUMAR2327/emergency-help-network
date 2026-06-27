const jwt = require('jsonwebtoken');
const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({ success: true, token, data: user });
};

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, bloodGroup, medicalInfo } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone and password required' });
    }
    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ success: false, message: 'Phone already registered' });

    // role is always 'user' on self-registration — never trust client-supplied role
    const user = await User.create({ name, phone, email, password, role: 'user', bloodGroup, medicalInfo });
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
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password required' });
    }
    const user = await User.findOne({ phone }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    sendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

// Frontend sends { token: "ExponentPushToken[...]" } — accept both field names
exports.updateFCMToken = async (req, res) => {
  try {
    const fcmToken = req.body.token || req.body.fcmToken;
    if (!fcmToken) return res.status(400).json({ success: false, message: 'token is required' });
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.status(200).json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ success: false, message: 'longitude and latitude required' });
    }
    await User.findByIdAndUpdate(req.user._id, {
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
    });
    res.status(200).json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW — called by ProfileScreen after editing name/bloodGroup
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'bloodGroup', 'medicalInfo'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (!updates.name || !updates.name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
