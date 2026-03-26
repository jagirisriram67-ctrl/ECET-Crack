const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: '' },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: '' },
  branch: { type: String, enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'MME', 'BSC_MATHS', ''], default: '' },
  college: { type: String, default: '' },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  status: { type: String, enum: ['pending', 'approved', 'blacklisted'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  blacklistReason: { type: String, default: '' },
  stats: {
    totalAttempts: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    subjectScores: { type: Map, of: { attempts: Number, avgScore: Number, totalCorrect: Number, totalQuestions: Number }, default: {} }
  },
  bookmarkedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  notifications: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password && this.password.length > 0 && !this.password.startsWith('$2a$')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateStats = function(quizAttempt) {
  this.stats.totalAttempts += 1;
  this.stats.totalCorrect += quizAttempt.correctCount;
  this.stats.totalQuestions += quizAttempt.totalQuestions;
  this.stats.avgScore = Math.round((this.stats.totalCorrect / this.stats.totalQuestions) * 100);
  
  const today = new Date().toDateString();
  const lastActive = this.stats.lastActiveDate ? new Date(this.stats.lastActiveDate).toDateString() : null;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  if (lastActive === yesterday) {
    this.stats.streak += 1;
  } else if (lastActive !== today) {
    this.stats.streak = 1;
  }
  this.stats.lastActiveDate = new Date();

  const subjectKey = quizAttempt.subject;
  if (subjectKey) {
    const existing = this.stats.subjectScores.get(subjectKey) || { attempts: 0, avgScore: 0, totalCorrect: 0, totalQuestions: 0 };
    existing.attempts += 1;
    existing.totalCorrect += quizAttempt.correctCount;
    existing.totalQuestions += quizAttempt.totalQuestions;
    existing.avgScore = Math.round((existing.totalCorrect / existing.totalQuestions) * 100);
    this.stats.subjectScores.set(subjectKey, existing);
  }
};

module.exports = mongoose.model('User', userSchema);
