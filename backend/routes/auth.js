const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/register - Register with email + password
router.post('/register', async (req, res) => {
  try {
    const { email, name, password, branch, college } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'An account with this email already exists' });

    const user = new User({ name, email, password, branch: branch || '', college: college || '', status: 'pending' });
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, branch: user.branch, college: user.college, role: user.role, status: user.status, stats: user.stats },
      message: 'Registration successful! Waiting for admin approval.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login - Login with email + password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.status === 'blacklisted') return res.status(403).json({ error: 'Your account has been suspended. Contact admin for details.', reason: user.blacklistReason });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, branch: user.branch, college: user.college, role: user.role, status: user.status, stats: user.stats }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/google - Google Sign-In (always approved)
router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId, avatar } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Email and name required' });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, googleId: googleId || '', avatar: avatar || '', status: 'pending' });
      await user.save();
    } else {
      if (googleId) user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      if (name) user.name = name;
      await user.save();
    }

    if (user.status === 'blacklisted') return res.status(403).json({ error: 'Your account has been suspended.', reason: user.blacklistReason });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, branch: user.branch, college: user.college, role: user.role, status: user.status, stats: user.stats } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/admin-login - Admin login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password !== process.env.JWT_SECRET) return res.status(401).json({ error: 'Invalid admin credentials' });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name: 'Admin', email, role: 'admin', status: 'approved' });
      await user.save();
    } else if (user.role !== 'admin') {
      user.role = 'admin';
      user.status = 'approved';
      await user.save();
    }

    const token = jwt.sign({ userId: user._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/auth/profile - Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, branch, college, password } = req.body;
    const user = req.user;
    if (name) user.name = name;
    if (branch) user.branch = branch;
    if (college) user.college = college;
    if (password && password.length >= 6) user.password = password;
    await user.save();
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
