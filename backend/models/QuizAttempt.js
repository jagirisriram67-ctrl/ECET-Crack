const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quizType: { type: String, enum: ['subject', 'unit', 'grand', 'mock'], required: true },
  subject: { type: String, default: '' },
  subjectCode: { type: String, default: '' },
  unit: { type: Number, default: 0 },
  unitName: { type: String, default: '' },
  questions: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    questionText: String,
    options: [String],
    correctAnswer: Number,
    selectedAnswer: { type: Number, default: -1 },
    isCorrect: { type: Boolean, default: false },
    explanation: String,
    timeTaken: { type: Number, default: 0 }
  }],
  totalQuestions: { type: Number, required: true },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  unanswered: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

quizAttemptSchema.index({ user: 1, createdAt: -1 });
quizAttemptSchema.index({ user: 1, quizType: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
