const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
  phone: { type: String, required: [true, 'Phone is required'], unique: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user','helper','hospital','police','ambulance','admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0,0] } },
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  medicalInfo: { type: String, maxlength: 500 },
  profilePhoto: { type: String },
  fcmToken: { type: String },
  stats: { emergenciesReported: { type: Number, default: 0 }, helpProvided: { type: Number, default: 0 }, responseRate: { type: Number, default: 100 }, averageRating: { type: Number, default: 5 } },
}, { timestamps: true });
userSchema.index({ location: '2dsphere' });
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.matchPassword = async function(p) { return bcrypt.compare(p, this.password); };
module.exports = mongoose.model('User', userSchema);