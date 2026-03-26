const express = require('express');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const { approvedAuth: auth } = require('../middleware/auth');
const router = express.Router();

// POST /api/quizzes/generate - Generate a quiz
router.post('/generate', auth, async (req, res) => {
  try {
    const { quizType, subjectCode, subject, unit, unitName } = req.body;
    if (!quizType) return res.status(400).json({ error: 'quizType is required' });

    let filter = { isActive: true };
    let limit = 10;
    let totalMarks = 10;

    switch (quizType) {
      case 'subject':
        if (!subjectCode) return res.status(400).json({ error: 'subjectCode required for subject quiz' });
        filter.subjectCode = subjectCode;
        if (unit) filter.unit = parseInt(unit);
        limit = 10;
        totalMarks = 10;
        break;
      case 'unit':
        if (!subjectCode || !unit) return res.status(400).json({ error: 'subjectCode and unit required' });
        filter.subjectCode = subjectCode;
        filter.unit = parseInt(unit);
        limit = 20;
        totalMarks = 20;
        break;
      case 'grand':
        if (!subjectCode) return res.status(400).json({ error: 'subjectCode required for grand test' });
        filter.subjectCode = subjectCode;
        limit = 100;
        totalMarks = 100;
        break;
      case 'mock':
        limit = 200;
        totalMarks = 200;
        break;
      default:
        return res.status(400).json({ error: 'Invalid quizType. Use: subject, unit, grand, mock' });
    }

    let questions = [];

    if (quizType === 'mock') {
      const difficulty = req.body.difficulty || 'mixture';
      const diffFilter = ['easy', 'medium', 'hard'].includes(difficulty) ? { difficulty } : {};
      
      const [mathQs, phyQs, chemQs, coreQs] = await Promise.all([
        Question.aggregate([{ $match: { subjectCode: 'MATH', isActive: true, ...diffFilter } }, { $sample: { size: 50 } }]),
        Question.aggregate([{ $match: { subjectCode: 'PHY', isActive: true, ...diffFilter } }, { $sample: { size: 25 } }]),
        Question.aggregate([{ $match: { subjectCode: 'CHEM', isActive: true, ...diffFilter } }, { $sample: { size: 25 } }]),
        Question.aggregate([{ $match: { subjectCode: { $nin: ['MATH', 'PHY', 'CHEM'] }, isActive: true, ...diffFilter } }, { $sample: { size: 100 } }])
      ]);
      questions = [...mathQs, ...phyQs, ...chemQs, ...coreQs];
    } else {
      questions = await Question.aggregate([
        { $match: filter },
        { $sample: { size: limit } }
      ]);
    }

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for the given criteria. Ask admin to upload questions.' });
    }

    // Create quiz attempt
    const attempt = new QuizAttempt({
      user: req.userId,
      quizType,
      subject: subject || '',
      subjectCode: subjectCode || '',
      unit: unit ? parseInt(unit) : 0,
      unitName: unitName || '',
      questions: questions.map(q => ({
        question: q._id,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: -1,
        isCorrect: false,
        explanation: q.explanation
      })),
      totalQuestions: questions.length,
      totalMarks: questions.length,
      startedAt: new Date()
    });

    await attempt.save();

    // Send questions without answers for the quiz
    const safeQuestions = questions.map((q, idx) => ({
      index: idx,
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      difficulty: q.difficulty,
      marks: q.marks || 1
    }));

    res.json({
      attemptId: attempt._id,
      quizType,
      subject: subject || '',
      unit: unit || 0,
      totalQuestions: questions.length,
      totalMarks: questions.length,
      questions: safeQuestions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quizzes/submit - Submit quiz answers
router.post('/submit', auth, async (req, res) => {
  try {
    const { attemptId, answers, timeTaken } = req.body;
    if (!attemptId || !answers) return res.status(400).json({ error: 'attemptId and answers required' });

    const attempt = await QuizAttempt.findOne({ _id: attemptId, user: req.userId });
    if (!attempt) return res.status(404).json({ error: 'Quiz attempt not found' });
    if (attempt.isCompleted) return res.status(400).json({ error: 'Quiz already submitted' });

    let correctCount = 0;
    let wrongCount = 0;
    let unanswered = 0;

    attempt.questions.forEach((q, idx) => {
      const answer = answers[idx];
      if (answer !== undefined && answer !== null && answer !== -1) {
        q.selectedAnswer = answer;
        q.isCorrect = answer === q.correctAnswer;
        if (q.isCorrect) correctCount++;
        else wrongCount++;
      } else {
        q.selectedAnswer = -1;
        q.isCorrect = false;
        unanswered++;
      }
      if (answers[`time_${idx}`]) q.timeTaken = answers[`time_${idx}`];
    });

    attempt.correctCount = correctCount;
    attempt.wrongCount = wrongCount;
    attempt.unanswered = unanswered;
    attempt.score = correctCount;
    attempt.percentage = Math.round((correctCount / attempt.totalQuestions) * 100);
    attempt.timeTaken = timeTaken || 0;
    attempt.completedAt = new Date();
    attempt.isCompleted = true;

    await attempt.save();

    // Update user stats
    const user = await User.findById(req.userId);
    user.updateStats(attempt);
    await user.save();

    res.json({
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      correctCount,
      wrongCount,
      unanswered,
      timeTaken: attempt.timeTaken,
      totalQuestions: attempt.totalQuestions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quizzes/attempts - Get user's quiz history
router.get('/attempts', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, quizType } = req.query;
    let filter = { user: req.userId, isCompleted: true };
    if (quizType) filter.quizType = quizType;

    const attempts = await QuizAttempt.find(filter)
      .select('-questions')
      .sort({ completedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await QuizAttempt.countDocuments(filter);
    res.json({ attempts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quizzes/attempts/:id/review - Full review with explanations
router.get('/attempts/:id/review', auth, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findOne({ _id: req.params.id, user: req.userId });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    const wrongAnswers = attempt.questions.filter(q => !q.isCorrect && q.selectedAnswer !== -1);
    const correctAnswers = attempt.questions.filter(q => q.isCorrect);
    const unansweredQs = attempt.questions.filter(q => q.selectedAnswer === -1);

    res.json({
      attempt: {
        _id: attempt._id,
        quizType: attempt.quizType,
        subject: attempt.subject,
        unit: attempt.unit,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        unanswered: attempt.unanswered,
        timeTaken: attempt.timeTaken,
        completedAt: attempt.completedAt
      },
      wrongAnswers: wrongAnswers.map(q => ({
        questionText: q.questionText,
        options: q.options,
        selectedAnswer: q.selectedAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      })),
      correctAnswers: correctAnswers.map(q => ({
        questionText: q.questionText,
        options: q.options,
        selectedAnswer: q.selectedAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      })),
      unansweredQuestions: unansweredQs.map(q => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      })),
      allQuestions: attempt.questions.map(q => ({
        questionText: q.questionText,
        options: q.options,
        selectedAnswer: q.selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect: q.isCorrect,
        explanation: q.explanation
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
