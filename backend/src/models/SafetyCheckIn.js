const mongoose = require('mongoose');

const safetyCheckInSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label: { type: String, maxlength: 100 }, // e.g. "Walking home from station"
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: { type: String },
  },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['active', 'confirmed_safe', 'alerted', 'cancelled'], default: 'active' },
  alertedAt: { type: Date },
}, { timestamps: true });

safetyCheckInSchema.index({ status: 1, expiresAt: 1 }); // for the poller's expiry scan

module.exports = mongoose.model('SafetyCheckIn', safetyCheckInSchema);
