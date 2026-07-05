const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  emergency: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true }, // denormalized so the mobile list doesn't need to populate on every fetch
  text: { type: String, required: true, maxlength: 1000 },
}, { timestamps: true });

// Chat history is fetched sorted by creation time, scoped to one emergency
messageSchema.index({ emergency: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
