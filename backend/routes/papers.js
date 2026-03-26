const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PreviousPaper = require('../models/PreviousPaper');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'papers');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `ecet_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/papers - List all papers
router.get('/', async (req, res) => {
  try {
    const { year, subject } = req.query;
    let filter = { isActive: true };
    if (year) filter.year = parseInt(year);
    if (subject) filter.subject = subject;
    const papers = await PreviousPaper.find(filter).sort({ year: -1 });
    res.json({ papers });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/papers - Upload paper (Admin)
router.post('/', adminAuth, upload.single('file'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.fileUrl = `/uploads/papers/${req.file.filename}`;
    if (data.year) data.year = parseInt(data.year);
    const paper = new PreviousPaper(data);
    await paper.save();
    res.status(201).json({ paper });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE /api/papers/:id
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await PreviousPaper.findByIdAndDelete(req.params.id);
    res.json({ message: 'Paper deleted' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
