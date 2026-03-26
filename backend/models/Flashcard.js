const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  subject: { type: String, required: true },
  subjectCode: { type: String, default: '' },
  unit: { type: Number, default: 0 },
  frontText: { type: String, required: true },
  backText: { type: String, required: true },
  frontImage: { type: String, default: '' },
  backImage: { type: String, default: '' },
  explanation: { type: String, default: '' },
  tags: [{ type: String }],
  day: { type: Number, default: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views: { type: Number, default: 0 }
}, { timestamps: true });

flashcardSchema.index({ subject: 1, day: 1 });
flashcardSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
