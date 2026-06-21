const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contacts: [
      {
        name: { type: String, required: true },
        phone: { type: String, default: null },
        email: { type: String, default: null },
        relationship: { type: String },
        notifyViaSMS: { type: Boolean, default: true },
        notifyViaWhatsApp: { type: Boolean, default: true },
        notifyViaCall: { type: Boolean, default: false },
        notifyViaEmail: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);