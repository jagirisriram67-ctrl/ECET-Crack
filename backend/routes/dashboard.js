const express = require('express');
const User = require('../models/User');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const Subject = require('../models/Subject');
const Flashcard = require('../models/Flashcard');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/dashboard/admin - Admin dashboard with chart data
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const totalQuestions = await Question.countDocuments({ isActive: true });
    const totalAttempts = await QuizAttempt.countDocuments();
    const totalFlashcards = await Flashcard.countDocuments({ isActive: true });

    // Weekly activity (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const weeklyActivity = await QuizAttempt.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 }, avgScore: { $avg: '$percentage' } } },
      { $sort: { _id: 1 } }
    ]);

    // Daily activity (last 30 days)
    const monthAgo = new Date(Date.now() - 30 * 86400000);
    const dailyActivity = await QuizAttempt.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        attempts: { $sum: 1 }, avgScore: { $avg: '$percentage' }, totalCorrect: { $sum: '$correctCount' }, totalQuestions: { $sum: '$totalQuestions' }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Subject distribution (pie chart)
    const subjectDistribution = await Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Quiz type distribution (pie chart)
    const quizTypeDistribution = await QuizAttempt.aggregate([
      { $group: { _id: '$quizType', count: { $sum: 1 }, avgScore: { $avg: '$percentage' } } },
      { $sort: { count: -1 } }
    ]);

    // Score distribution (bar chart - ranges)
    const scoreDistribution = await QuizAttempt.aggregate([
      { $bucket: {
        groupBy: '$percentage',
        boundaries: [0, 20, 40, 60, 80, 101],
        default: 'Other',
        output: { count: { $sum: 1 } }
      }}
    ]);

    // Branch distribution
    const branchDistribution = await User.aggregate([
      { $match: { role: 'student', branch: { $ne: '' } } },
      { $group: { _id: '$branch', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Subject performance (avg scores by subject)
    const subjectPerformance = await QuizAttempt.aggregate([
      { $group: { _id: '$subject', avgScore: { $avg: '$percentage' }, attempts: { $sum: 1 } } },
      { $sort: { avgScore: -1 } }
    ]);

    // Recent attempts
    const recentAttempts = await QuizAttempt.find()
      .populate('user', 'name branch')
      .sort({ createdAt: -1 }).limit(10);

    // Top performers
    const topPerformers = await User.find({ role: 'student', 'stats.totalAttempts': { $gte: 1 } })
      .select('name branch stats.avgScore stats.totalAttempts stats.streak')
      .sort({ 'stats.avgScore': -1 }).limit(5);

    res.json({
      stats: { totalUsers, pendingUsers, totalQuestions, totalAttempts, totalFlashcards },
      charts: { weeklyActivity, dailyActivity, subjectDistribution, quizTypeDistribution, scoreDistribution, branchDistribution, subjectPerformance },
      recentAttempts, topPerformers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/user - User dashboard
router.get('/user', auth, async (req, res) => {
  try {
    const user = req.user;
    const recentAttempts = await QuizAttempt.find({ user: user._id })
      .sort({ createdAt: -1 }).limit(5);
    const totalAttempts = await QuizAttempt.countDocuments({ user: user._id });

    // User's score trend (last 10 quizzes)
    const scoreTrend = await QuizAttempt.find({ user: user._id })
      .select('percentage quizType subject createdAt')
      .sort({ createdAt: -1 }).limit(10);

    res.json({ user, recentAttempts, totalAttempts, scoreTrend: scoreTrend.reverse() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { branch } = req.query;
    let filter = { role: 'student', status: 'approved', 'stats.totalAttempts': { $gte: 1 } };
    if (branch) filter.branch = branch;
    const leaderboard = await User.find(filter)
      .select('name branch avatar stats')
      .sort({ 'stats.avgScore': -1 }).limit(50);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
