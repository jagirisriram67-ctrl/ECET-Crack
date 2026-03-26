const express = require('express');
const SupportTicket = require('../models/SupportTicket');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// POST /api/support - User creates support ticket
router.post('/', auth, async (req, res) => {
  try {
    const { type, subject, message, priority } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });
    const ticket = new SupportTicket({ user: req.userId, type, subject, message, priority });
    await ticket.save();
    res.status(201).json({ ticket, message: 'Ticket submitted successfully! Admin will respond soon.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/support - User's own tickets
router.get('/', auth, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/support/admin - Admin sees all tickets
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { status, type } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name email branch avatar')
      .populate('repliedBy', 'name')
      .sort({ createdAt: -1 });
    const counts = {
      open: await SupportTicket.countDocuments({ status: 'open' }),
      in_progress: await SupportTicket.countDocuments({ status: 'in_progress' }),
      resolved: await SupportTicket.countDocuments({ status: 'resolved' }),
      total: await SupportTicket.countDocuments()
    };
    res.json({ tickets, counts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/support/admin/:id - Admin replies/updates ticket
router.put('/admin/:id', adminAuth, async (req, res) => {
  try {
    const { adminReply, status } = req.body;
    const update = {};
    if (adminReply) { update.adminReply = adminReply; update.repliedBy = req.userId; update.repliedAt = new Date(); }
    if (status) update.status = status;
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name email branch');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/support/admin/:id - Admin deletes ticket
router.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    await SupportTicket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
