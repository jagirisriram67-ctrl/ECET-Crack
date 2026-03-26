const express = require('express');
const User = require('../models/User');
const SupportTicket = require('../models/SupportTicket');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/admin/pending - Get pending users count + list
router.get('/pending', adminAuth, async (req, res) => {
  try {
    const pending = await User.find({ status: 'pending', role: 'student' })
      .select('-password -bookmarkedQuestions')
      .sort({ createdAt: -1 });
    res.json({ pending, count: pending.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { branch, status, page = 1, limit = 50, search } = req.query;
    let filter = {};
    if (branch) filter.branch = branch;
    if (status) filter.status = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const users = await User.find(filter)
      .select('-bookmarkedQuestions')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    const total = await User.countDocuments(filter);
    const counts = {
      total: await User.countDocuments({}),
      pending: await User.countDocuments({ status: 'pending' }),
      approved: await User.countDocuments({ status: 'approved' }),
      blacklisted: await User.countDocuments({ status: 'blacklisted' })
    };
    res.json({ users, total, counts, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id/approve - Approve user
router.put('/users/:id/approve', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      status: 'approved', approvedBy: req.userId, approvedAt: new Date()
    }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user, message: `${user.name} has been approved!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id/blacklist - Blacklist user
router.put('/users/:id/blacklist', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, {
      status: 'blacklisted', blacklistReason: reason || 'Violation of rules'
    }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user, message: `${user.name} has been blacklisted.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id/unblock - Unblock blacklisted user
router.put('/users/:id/unblock', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      status: 'approved', blacklistReason: ''
    }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user, message: `${user.name} has been unblocked.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id/password - Admin reset user password
router.put('/users/:id/password', adminAuth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = password;
    await user.save();
    res.json({ message: `Password reset for ${user.name}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id/role - Change user role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
