const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  subject: { type: String, required: true, index: true },
  subjectCode: { type: String, required: true, index: true },
  unit: { type: Number, required: true, index: true },
  unitName: { type: String, default: '' },
  questionText: { type: String, required: true },
  options: {
    type: [String],
    validate: [arr => arr.length === 4, 'Must have exactly 4 options']
  },
  correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  marks: { type: Number, default: 1 },
  tags: [String],
  previousYearTag: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

questionSchema.index({ subject: 1, unit: 1, difficulty: 1 });
questionSchema.index({ subjectCode: 1, unit: 1 });

module.exports = mongoose.model('Question', questionSchema);
