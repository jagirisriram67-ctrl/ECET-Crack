const express = require('express');
const Notification = require('../models/Notification');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/notifications/all - All notifications for admin (MUST be before /:id routes)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications - Get notifications for student
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;
    const filter = {
      isActive: true,
      $or: [
        { targetBranch: 'ALL' },
        { targetBranch: user.branch || 'ALL' }
      ]
    };
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications - Create notification (Admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const notification = new Notification({ ...req.body, createdBy: req.userId });
    await notification.save();
    res.status(201).json({ notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notifications/:id - Delete notification (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
