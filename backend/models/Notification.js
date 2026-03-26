const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['quiz', 'note', 'general', 'update', 'achievement'], default: 'general' },
  icon: { type: String, default: '🔔' },
  targetBranch: { type: String, default: 'ALL' },
  link: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
