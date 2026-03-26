const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  branch: { type: String, enum: ['COMMON', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'MME', 'BSC_MATHS'], default: 'COMMON' },
  description: { type: String, default: '' },
  icon: { type: String, default: '📚' },
  color: { type: String, default: '#6C63FF' },
  units: [{
    unitNumber: { type: Number, required: true },
    name: { type: String, required: true },
    topics: [String],
    questionCount: { type: Number, default: 0 }
  }],
  isCommon: { type: Boolean, default: false },
  totalQuestions: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
