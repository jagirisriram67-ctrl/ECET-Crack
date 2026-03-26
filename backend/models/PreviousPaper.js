const mongoose = require('mongoose');

const previousPaperSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: Number, required: true },
  subject: { type: String, default: 'General' },
  type: { type: String, enum: ['pdf', 'link'], default: 'pdf' },
  fileUrl: { type: String, default: '' },
  externalLink: { type: String, default: '' },
  description: { type: String, default: '' },
  downloads: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PreviousPaper', previousPaperSchema);
