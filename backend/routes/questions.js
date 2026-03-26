const express = require('express');
const Question = require('../models/Question');
const Subject = require('../models/Subject');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/questions - Get questions with filters
router.get('/', auth, async (req, res) => {
  try {
    const { subject, subjectCode, unit, difficulty, limit = 50, page = 1 } = req.query;
    let filter = { isActive: true };
    if (subject) filter.subject = subject;
    if (subjectCode) filter.subjectCode = subjectCode;
    if (unit) filter.unit = parseInt(unit);
    if (difficulty) filter.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const questions = await Question.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });
    const total = await Question.countDocuments(filter);
    res.json({ questions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/questions/stats - Question statistics (Admin) — MUST be before /:id
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const total = await Question.countDocuments({ isActive: true });
    const bySubject = await Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const byDifficulty = await Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);
    res.json({ total, bySubject, byDifficulty });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/questions - Create question (Admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const question = new Question({ ...req.body, createdBy: req.userId });
    await question.save();
    // Update subject question count
    await Subject.findOneAndUpdate(
      { code: question.subjectCode, 'units.unitNumber': question.unit },
      { $inc: { totalQuestions: 1, 'units.$.questionCount': 1 } }
    );
    res.status(201).json({ question });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/questions/bulk-upload - Bulk upload questions via JSON (Admin)
router.post('/bulk-upload', adminAuth, async (req, res) => {
  try {
    const { subject, subjectCode, unit, unitName, questions } = req.body;
    if (!subject || !subjectCode || !unit || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Required: subject, subjectCode, unit, questions[]' });
    }

    const formattedQuestions = questions.map(q => ({
      subject,
      subjectCode,
      unit: parseInt(unit),
      unitName: unitName || '',
      questionText: q.text || q.questionText,
      options: q.options,
      correctAnswer: q.correct !== undefined ? q.correct : q.correctAnswer,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      marks: q.marks || 1,
      tags: q.tags || [],
      previousYearTag: q.previousYearTag || '',
      createdBy: req.userId,
      isActive: true
    }));

    const inserted = await Question.insertMany(formattedQuestions);

    // Update subject question counts
    await Subject.findOneAndUpdate(
      { code: subjectCode, 'units.unitNumber': parseInt(unit) },
      { $inc: { totalQuestions: inserted.length, 'units.$.questionCount': inserted.length } }
    );

    res.status(201).json({ message: `Successfully uploaded ${inserted.length} questions`, count: inserted.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/questions/:id - Update question (Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json({ question });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/questions/:id - Delete question (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (question) {
      await Subject.findOneAndUpdate(
        { code: question.subjectCode, 'units.unitNumber': question.unit },
        { $inc: { totalQuestions: -1, 'units.$.questionCount': -1 } }
      );
    }
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

