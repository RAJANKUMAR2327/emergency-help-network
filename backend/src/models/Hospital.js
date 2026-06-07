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