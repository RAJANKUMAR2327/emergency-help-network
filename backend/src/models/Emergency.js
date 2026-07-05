const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['medical', 'accident', 'fire', 'crime', 'natural_disaster', 'other'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high',
    },
    status: {
      type: String,
      enum: ['active', 'responded', 'resolved', 'cancelled', 'false_alarm'],
      default: 'active',
    },
    // How this emergency was triggered — lets the SMS CANCEL flow find
    // "the SMS-sourced emergency I just created" specifically, and is
    // generally useful for knowing how the offline fallback gets used.
    source: { type: String, enum: ['app', 'sms'], default: 'app' },
    description: { type: String, maxlength: 1000 },
    photos: [{ type: String }],

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], required: true },
      address: { type: String },
    },

    responders: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        acceptedAt: { type: Date, default: Date.now },
        arrivedAt: { type: Date },
        status: {
          type: String,
          enum: ['en_route', 'arrived', 'helping', 'completed'],
          default: 'en_route',
        },
        currentLocation: {
          type: { type: String, enum: ['Point'], default: 'Point' },
          coordinates: [Number],
        },
        // Set once by the reporter after the emergency resolves. Not
        // required — a responder who never gets rated just doesn't
        // affect their average, rather than being penalized.
        rating: { type: Number, min: 1, max: 5 },
        ratedAt: { type: Date },
      },
    ],

    notifiedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notifiedServices: {
      ambulance: { type: Boolean, default: false },
      police: { type: Boolean, default: false },
      hospital: { type: String, default: null },
    },

    timeline: [
      {
        event: String,
        timestamp: { type: Date, default: Date.now },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],

    resolvedAt: { type: Date },
    responseTimeSeconds: { type: Number },
  },
  { timestamps: true }
);

emergencySchema.index({ location: '2dsphere' });
emergencySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Emergency', emergencySchema);
