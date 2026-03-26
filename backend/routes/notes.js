const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Note = require('../models/Note');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'notes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.md', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, MD, TXT, and image files allowed'));
  }
});

// GET /api/notes - Get notes with filters
router.get('/', async (req, res) => {
  try {
    const { subject, subjectCode, unit, type, page = 1, limit = 20 } = req.query;
    let filter = { isActive: true };
    if (subject) filter.subject = subject;
    if (subjectCode) filter.subjectCode = subjectCode;
    if (unit) filter.unit = parseInt(unit);
    if (type) filter.type = type;

    const notes = await Note.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    const total = await Note.countDocuments(filter);
    res.json({ notes, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notes/:id
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    note.views += 1;
    await note.save();
    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notes - Create a note (Admin)
router.post('/', adminAuth, upload.single('file'), async (req, res) => {
  try {
    const noteData = {
      ...req.body,
      uploadedBy: req.userId,
      unit: req.body.unit ? parseInt(req.body.unit) : 0
    };
    if (req.file) {
      noteData.fileUrl = `/uploads/notes/${req.file.filename}`;
      noteData.fileName = req.file.originalname;
      if (!noteData.type) noteData.type = 'pdf';
    }
    if (!noteData.type) noteData.type = 'markdown';
    const note = new Note(noteData);
    await note.save();
    res.status(201).json({ note });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notes/:id - Update note (Admin)
router.put('/:id', adminAuth, upload.single('file'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.body.unit) updateData.unit = parseInt(req.body.unit);
    if (req.file) {
      updateData.fileUrl = `/uploads/notes/${req.file.filename}`;
      updateData.fileName = req.file.originalname;
    }
    const note = await Note.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notes/:id - Delete note (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (note && note.fileUrl) {
      const filePath = path.join(__dirname, '..', note.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
