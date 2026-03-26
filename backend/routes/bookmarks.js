const express = require('express');
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const { auth } = require('../middleware/auth');
const router = express.Router();

// POST /api/bookmarks/:questionId - Toggle bookmark
router.post('/:questionId', auth, async (req, res) => {
  try {
    const user = req.user;
    const qId = req.params.questionId;
    const idx = user.bookmarkedQuestions.indexOf(qId);
    if (idx > -1) {
      user.bookmarkedQuestions.splice(idx, 1);
      await user.save();
      res.json({ bookmarked: false, message: 'Removed from bookmarks' });
    } else {
      user.bookmarkedQuestions.push(qId);
      await user.save();
      res.json({ bookmarked: true, message: 'Added to bookmarks' });
    }
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET /api/bookmarks - Get all bookmarked questions
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('bookmarkedQuestions');
    res.json({ bookmarks: user.bookmarkedQuestions || [] });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET /api/bookmarks/achievements - Calculate user badges
router.get('/achievements', auth, async (req, res) => {
  try {
    const user = req.user;
    const stats = user.stats;
    const attempts = await QuizAttempt.find({ user: user._id }).sort({ createdAt: -1 });

    const badges = [];

    // Streak badges
    if (stats.streak >= 3) badges.push({ id: 'streak3', name: 'Hot Starter', icon: '🔥', desc: '3-day streak', unlocked: true });
    if (stats.streak >= 7) badges.push({ id: 'streak7', name: 'Week Warrior', icon: '⚡', desc: '7-day streak', unlocked: true });
    if (stats.streak >= 30) badges.push({ id: 'streak30', name: 'Monthly Legend', icon: '🏆', desc: '30-day streak', unlocked: true });

    // Quiz count badges
    if (stats.totalAttempts >= 1) badges.push({ id: 'first_quiz', name: 'First Step', icon: '👣', desc: 'Completed first quiz', unlocked: true });
    if (stats.totalAttempts >= 10) badges.push({ id: 'quiz10', name: 'Quiz Lover', icon: '📝', desc: '10 quizzes completed', unlocked: true });
    if (stats.totalAttempts >= 50) badges.push({ id: 'quiz50', name: 'Quiz Master', icon: '🎓', desc: '50 quizzes completed', unlocked: true });
    if (stats.totalAttempts >= 100) badges.push({ id: 'quiz100', name: 'Century Club', icon: '💯', desc: '100 quizzes completed', unlocked: true });

    // Score badges
    if (stats.avgScore >= 50) badges.push({ id: 'avg50', name: 'Half Way', icon: '📈', desc: 'Average score 50%+', unlocked: true });
    if (stats.avgScore >= 80) badges.push({ id: 'avg80', name: 'High Scorer', icon: '🌟', desc: 'Average score 80%+', unlocked: true });
    if (stats.avgScore >= 95) badges.push({ id: 'avg95', name: 'Near Perfect', icon: '💎', desc: 'Average score 95%+', unlocked: true });

    // Perfect score
    const perfectScores = attempts.filter(a => a.percentage === 100).length;
    if (perfectScores >= 1) badges.push({ id: 'perfect', name: 'Perfect!', icon: '🎯', desc: 'Scored 100%', unlocked: true });
    if (perfectScores >= 5) badges.push({ id: 'perfect5', name: 'Flawless', icon: '💫', desc: '5 perfect scores', unlocked: true });

    // Subject variety
    const uniqueSubjects = new Set(attempts.map(a => a.subject)).size;
    if (uniqueSubjects >= 3) badges.push({ id: 'multi_sub', name: 'Multi-Tasker', icon: '🎪', desc: '3+ subjects studied', unlocked: true });
    if (uniqueSubjects >= 5) badges.push({ id: 'all_rounder', name: 'All-Rounder', icon: '🌈', desc: '5+ subjects studied', unlocked: true });

    // Locked badges (motivational)
    const allBadges = [
      { id: 'streak3', name: 'Hot Starter', icon: '🔥', desc: '3-day streak' },
      { id: 'streak7', name: 'Week Warrior', icon: '⚡', desc: '7-day streak' },
      { id: 'streak30', name: 'Monthly Legend', icon: '🏆', desc: '30-day streak' },
      { id: 'first_quiz', name: 'First Step', icon: '👣', desc: 'Complete first quiz' },
      { id: 'quiz10', name: 'Quiz Lover', icon: '📝', desc: '10 quizzes' },
      { id: 'quiz50', name: 'Quiz Master', icon: '🎓', desc: '50 quizzes' },
      { id: 'quiz100', name: 'Century Club', icon: '💯', desc: '100 quizzes' },
      { id: 'avg50', name: 'Half Way', icon: '📈', desc: 'Avg 50%+' },
      { id: 'avg80', name: 'High Scorer', icon: '🌟', desc: 'Avg 80%+' },
      { id: 'avg95', name: 'Near Perfect', icon: '💎', desc: 'Avg 95%+' },
      { id: 'perfect', name: 'Perfect!', icon: '🎯', desc: 'Score 100%' },
      { id: 'perfect5', name: 'Flawless', icon: '💫', desc: '5 perfect scores' },
      { id: 'multi_sub', name: 'Multi-Tasker', icon: '🎪', desc: '3+ subjects' },
      { id: 'all_rounder', name: 'All-Rounder', icon: '🌈', desc: '5+ subjects' },
    ];

    const unlockedIds = new Set(badges.map(b => b.id));
    const fullBadges = allBadges.map(b => ({ ...b, unlocked: unlockedIds.has(b.id) }));

    res.json({ badges: fullBadges, unlockedCount: badges.length, totalCount: allBadges.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET /api/bookmarks/heatmap - Study streak heatmap data (last 90 days)
router.get('/heatmap', auth, async (req, res) => {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
    const data = await QuizAttempt.aggregate([
      { $match: { user: req.user._id, createdAt: { $gte: ninetyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, avg: { $avg: '$percentage' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ heatmap: data });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
