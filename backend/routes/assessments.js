const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { protect, authorize } = require('../middleware/auth');
const Assessment = require('../models/Assessment');

// Configure multer for PDF uploads (memory storage — no disk file left behind)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

// ─── GET ALL ──────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { isPublished: true };
    const assessments = await Assessment.find(query)
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: assessments.length, data: assessments });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET ONE ──────────────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id).populate('course', 'title');
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    if (req.user.role !== 'admin') {
      const safe = assessment.toObject();
      safe.questions = safe.questions.map(({ correctAnswer, ...rest }) => rest);
      return res.json({ success: true, data: safe });
    }
    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── CREATE ───────────────────────────────────────────────────────────────────
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, description, category, difficulty, duration, courseId } = req.body;
    if (!title || !category)
      return res.status(400).json({ success: false, message: 'Title and category are required' });

    const assessment = await Assessment.create({
      title,
      description: description || title,
      category,
      difficulty: difficulty || 'Medium',
      duration: duration || 30,
      passingScore: 80,
      course: courseId || undefined,
      createdBy: req.user.id,
      isPublished: true
    });
    return res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    res.json({ success: true, message: 'Assessment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── UPLOAD PDF & PARSE QUESTIONS ─────────────────────────────────────────────
router.post('/:id/upload-questions', protect, authorize('admin'), upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }

    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Parse PDF from buffer (no disk file)
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text;

    console.log('PDF text extracted, length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));

    const questions = parsePDFQuestions(text);
    console.log('Questions parsed:', questions.length);

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found in PDF. Please ensure your PDF follows the required format: Q1. Question? A) opt B) opt C) opt D) opt Answer: A'
      });
    }

    // Replace all questions with the parsed ones (up to 20)
    assessment.questions = questions.slice(0, 20);
    await assessment.save();

    res.json({
      success: true,
      message: `Successfully imported ${assessment.questions.length} question${assessment.questions.length !== 1 ? 's' : ''} from PDF`,
      data: assessment
    });
  } catch (error) {
    console.error('Upload questions error:', error);
    res.status(500).json({ success: false, message: 'Error processing PDF: ' + error.message });
  }
});

// ─── PDF PARSER ───────────────────────────────────────────────────────────────
function parsePDFQuestions(rawText) {
  const questions = [];

  // Normalise line endings and collapse excessive whitespace
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  // ── Strategy 1: split on numbered question markers ──────────────────────────
  // Matches: "1.", "Q1.", "Q.1", "Question 1", "Question 1.", "1)"
  const qSplitRegex = /(?:^|\n)(?:Q\.?\s*|Question\s+)?(\d{1,2})[.)]\s+/gim;

  const blocks = [];
  let lastIndex = 0;
  let match;

  // Collect all split positions
  const splits = [];
  while ((match = qSplitRegex.exec(text)) !== null) {
    splits.push({ index: match.index, end: match.index + match[0].length });
  }

  if (splits.length >= 2) {
    for (let i = 0; i < splits.length; i++) {
      const start = splits[i].end;
      const end = i + 1 < splits.length ? splits[i + 1].index : text.length;
      blocks.push(text.slice(start, end).trim());
    }
  } else {
    // ── Strategy 2: split on blank lines (each block = one question) ──────────
    text.split(/\n\s*\n/).forEach(b => { if (b.trim()) blocks.push(b.trim()); });
  }

  for (const block of blocks) {
    const q = parseQuestionBlock(block);
    if (q) questions.push(q);
  }

  return questions;
}

function parseQuestionBlock(block) {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;

  // ── Find where options start ─────────────────────────────────────────────────
  // Option line: starts with A), A., a), a., (A), (a)
  const optionLineRe = /^[\(\[]?([A-Da-d])[\)\].:]\s*(.+)/;
  const answerLineRe = /^(?:answer|correct answer|ans|key)\s*[:\-]?\s*([A-Da-d])\b/i;

  let questionLines = [];
  let optionLines = [];
  let answerLine = '';

  let phase = 'question'; // question → options → answer

  for (const line of lines) {
    if (answerLineRe.test(line)) {
      answerLine = line;
      phase = 'done';
      continue;
    }
    if (optionLineRe.test(line)) {
      phase = 'options';
    }
    if (phase === 'question') {
      questionLines.push(line);
    } else if (phase === 'options') {
      optionLines.push(line);
    }
  }

  const questionText = questionLines.join(' ').trim();
  if (!questionText) return null;

  // Parse options
  const options = [];
  for (const ol of optionLines) {
    const m = ol.match(optionLineRe);
    if (m) options.push(m[2].trim());
  }

  if (options.length < 2) return null;

  // Parse correct answer
  let correctAnswer = '';
  if (answerLine) {
    const m = answerLine.match(answerLineRe);
    if (m) {
      const idx = m[1].toUpperCase().charCodeAt(0) - 65; // A=0, B=1 …
      if (idx >= 0 && idx < options.length) {
        correctAnswer = options[idx];
      }
    }
  }

  // If no explicit answer line, try inline answer at end of last option line
  // e.g. "D) Madrid  *" or "D) Madrid [correct]"
  if (!correctAnswer) {
    for (let i = 0; i < optionLines.length; i++) {
      if (/\*|correct|\[ans\]/i.test(optionLines[i])) {
        correctAnswer = options[i];
        break;
      }
    }
  }

  if (!correctAnswer) return null;

  return {
    question: questionText,
    type: 'multiple-choice',
    options,
    correctAnswer,
    points: 1,
    explanation: ''
  };
}

// ─── ADD QUESTION MANUALLY ────────────────────────────────────────────────────
router.post('/:id/questions', protect, authorize('admin'), async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    const { question, type, options, correctAnswer, points, explanation } = req.body;
    if (!question || !correctAnswer)
      return res.status(400).json({ success: false, message: 'Question and correct answer are required' });

    assessment.questions.push({
      question,
      type: type || 'multiple-choice',
      options: options || [],
      correctAnswer,
      points: points || 1,
      explanation: explanation || ''
    });

    await assessment.save();
    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── UPDATE QUESTION ──────────────────────────────────────────────────────────
router.put('/:id/questions/:questionId', protect, authorize('admin'), async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    const question = assessment.questions.id(req.params.questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    Object.assign(question, req.body);
    await assessment.save();
    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── DELETE QUESTION ──────────────────────────────────────────────────────────
router.delete('/:id/questions/:questionId', protect, authorize('admin'), async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    assessment.questions.pull(req.params.questionId);
    await assessment.save();
    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── SUBMIT ATTEMPT ───────────────────────────────────────────────────────────
router.post('/:id/attempt', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    const { answers, timeTaken } = req.body;

    let earnedPoints = 0;
    const gradedAnswers = [];

    for (const q of assessment.questions) {
      const userAnswer = (answers || []).find(a => a.questionId === q._id.toString());
      const isCorrect = userAnswer && userAnswer.answer === q.correctAnswer;
      if (isCorrect) earnedPoints += q.points;
      gradedAnswers.push({
        questionId: q._id,
        answer: userAnswer?.answer || '',
        isCorrect: !!isCorrect,
        points: isCorrect ? q.points : 0
      });
    }

    const totalPoints = assessment.totalPoints || assessment.questions.reduce((s, q) => s + q.points, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= (assessment.passingScore || 80);

    assessment.attempts.push({
      user: req.user.id,
      score: earnedPoints,
      percentage,
      answers: gradedAnswers,
      startedAt: new Date(Date.now() - (timeTaken || 0) * 1000),
      completedAt: new Date(),
      timeTaken: timeTaken || 0,
      passed
    });
    await assessment.save();

    // ── Notify admins about assessment completion ──────────────────────────────
    const Notification = require('../models/Notification');
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' }, '_id');
    if (admins.length) {
      await Notification.insertMany(admins.map(a => ({
        user: a._id,
        type: 'assessment_completed',
        title: '📝 Assessment Completed',
        message: `${req.user.name} completed "${assessment.title}" — scored ${percentage}% (${passed ? 'Passed ✅' : 'Failed ❌'}).`,
        data: {
          assessmentId: assessment._id.toString(),
          assessmentTitle: assessment.title,
          userName: req.user.name,
          percentage,
          passed
        }
      })));
    }

    // ── Notify the user of their result ───────────────────────────────────────
    await Notification.create({
      user: req.user.id,
      type: passed ? 'general' : 'general',
      title: passed ? `🎉 You passed "${assessment.title}"!` : `📚 Assessment Result: "${assessment.title}"`,
      message: passed
        ? `Congratulations! You scored ${percentage}% and passed the assessment. Keep up the great work!`
        : `You scored ${percentage}% on "${assessment.title}". You need ${assessment.passingScore || 80}% to pass. Review the feedback and try again!`,
      data: {
        assessmentId: assessment._id.toString(),
        assessmentTitle: assessment.title,
        percentage,
        passed
      }
    });

    res.json({
      success: true,
      data: {
        score: earnedPoints,
        totalPoints,
        percentage,
        passed,
        passingScore: assessment.passingScore || 80,
        timeTaken,
        gradedAnswers: gradedAnswers.map((ga, i) => ({
          ...ga,
          correctAnswer: assessment.questions[i]?.correctAnswer,
          explanation: assessment.questions[i]?.explanation || ''
        }))
      }
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET RESULTS ──────────────────────────────────────────────────────────────
router.get('/:id/results', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    const userAttempts = assessment.attempts.filter(a => a.user.toString() === req.user.id);
    res.json({ success: true, data: userAttempts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
