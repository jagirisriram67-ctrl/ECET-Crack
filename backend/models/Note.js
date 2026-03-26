const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  subjectCode: { type: String, required: true },
  unit: { type: Number, default: 0 },
  unitName: { type: String, default: '' },
  type: { type: String, enum: ['pdf', 'markdown'], required: true },
  content: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  description: { type: String, default: '' },
  color: { type: String, default: '#6C63FF' },
  icon: { type: String, default: '📄' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  downloads: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

noteSchema.index({ subject: 1, unit: 1 });

module.exports = mongoose.model('Note', noteSchema);
