const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Flashcard = require('../models/Flashcard');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Multer setup for flashcard images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'flashcards');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/flashcards/daily - Get today's flashcards (2 topics)
router.get('/daily', auth, async (req, res) => {
  try {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const flashcards = await Flashcard.find({ isActive: true, day: { $in: [dayOfYear % 100, (dayOfYear % 100) + 1] } })
      .sort({ topic: 1, createdAt: 1 }).limit(20);
    if (flashcards.length === 0) {
      const all = await Flashcard.find({ isActive: true }).sort({ createdAt: -1 }).limit(20);
      return res.json({ flashcards: all, day: dayOfYear });
    }
    res.json({ flashcards, day: dayOfYear });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/flashcards - Get all flashcards with filters
router.get('/', async (req, res) => {
  try {
    const { subject, subjectCode, topic, day, page = 1, limit = 50 } = req.query;
    let filter = { isActive: true };
    if (subject) filter.subject = subject;
    if (subjectCode) filter.subjectCode = subjectCode;
    if (topic) filter.topic = { $regex: topic, $options: 'i' };
    if (day) filter.day = parseInt(day);
    const flashcards = await Flashcard.find(filter)
      .sort({ day: 1, topic: 1, createdAt: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    const total = await Flashcard.countDocuments(filter);
    res.json({ flashcards, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/flashcards - Create flashcard (Admin)
router.post('/', adminAuth, upload.fields([
  { name: 'frontImage', maxCount: 1 },
  { name: 'backImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.userId };
    if (req.files?.frontImage) data.frontImage = `/uploads/flashcards/${req.files.frontImage[0].filename}`;
    if (req.files?.backImage) data.backImage = `/uploads/flashcards/${req.files.backImage[0].filename}`;
    if (data.day) data.day = parseInt(data.day);
    if (data.tags && typeof data.tags === 'string') data.tags = data.tags.split(',').map(t => t.trim());
    const flashcard = new Flashcard(data);
    await flashcard.save();
    res.status(201).json({ flashcard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/flashcards/bulk - Bulk upload flashcards via JSON (Admin)
router.post('/bulk', adminAuth, async (req, res) => {
  try {
    const { subject, subjectCode, topic, day, flashcards } = req.body;
    if (!subject || !topic || !flashcards || !Array.isArray(flashcards)) {
      return res.status(400).json({ error: 'Required: subject, topic, flashcards[]' });
    }
    const formatted = flashcards.map(f => ({
      subject, subjectCode: subjectCode || '', topic,
      day: day ? parseInt(day) : 0,
      frontText: f.front || f.frontText,
      backText: f.back || f.backText,
      frontImage: f.frontImage || '',
      backImage: f.backImage || '',
      explanation: f.explanation || '',
      tags: f.tags || [],
      difficulty: f.difficulty || 'medium',
      createdBy: req.userId, isActive: true
    }));
    const inserted = await Flashcard.insertMany(formatted);
    res.status(201).json({ message: `Uploaded ${inserted.length} flashcards`, count: inserted.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/flashcards/:id - Update flashcard (Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const flashcard = await Flashcard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!flashcard) return res.status(404).json({ error: 'Flashcard not found' });
    res.json({ flashcard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/flashcards/:id - Delete flashcard (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Flashcard.findByIdAndDelete(req.params.id);
    res.json({ message: 'Flashcard deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
