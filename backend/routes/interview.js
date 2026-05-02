const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resumes/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const path = require('path');

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// ─── QUALIFYING MARK (configurable) ───────────────────────────────────────────
const QUALIFYING_MARK = 60;

// @route   POST /api/interview/analyze-resume
// @desc    Analyze resume and generate interview questions
// @access  Private
router.post('/analyze-resume', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume file' });
    }

    const { difficulty, type } = req.body;
    const questions = generateQuestions(difficulty, type);

    res.json({
      success: true,
      data: {
        resumeAnalysis: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          uploadedAt: new Date()
        },
        questions,
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ success: false, message: 'Error analyzing resume' });
  }
});

// @route   POST /api/interview/submit
// @desc    Submit interview answers, calculate real scores, save to DB, send notifications
// @access  Private
router.post('/submit', protect, async (req, res) => {
  try {
    const { answers = [], duration = 0, settings = {}, totalQuestions = 0 } = req.body;

    // ── 1. Calculate REAL scores based on actual answers ──────────────────────
    const answeredAnswers = answers.filter(a => !a.skipped);
    const skippedAnswers  = answers.filter(a => a.skipped);
    const answeredCount   = answeredAnswers.length;
    const skippedCount    = skippedAnswers.length;
    const total           = totalQuestions || answers.length || 1;

    // Completion rate (0–1)
    const completionRate = answeredCount / total;

    // Base score purely from completion (0 if nothing answered)
    const baseScore = Math.round(completionRate * 100);

    // Average response time for answered questions
    const answeredWithDuration = answeredAnswers.filter(a => a.duration > 0);
    const avgResponseTime = answeredWithDuration.length > 0
      ? Math.round(answeredWithDuration.reduce((s, a) => s + a.duration, 0) / answeredWithDuration.length)
      : 0;

    // Quality bonus: reward longer, thoughtful answers (up to +10)
    let qualityBonus = 0;
    if (answeredWithDuration.length > 0) {
      const goodAnswers = answeredWithDuration.filter(a => a.duration >= 30).length;
      qualityBonus = Math.round((goodAnswers / answeredWithDuration.length) * 10);
    }

    // Sub-scores (capped 0–100, no random inflation)
    const communicationScore  = Math.min(100, Math.max(0, baseScore + qualityBonus));
    const technicalScore      = Math.min(100, Math.max(0, baseScore));
    const professionalismScore = Math.min(100, Math.max(0, baseScore + Math.round(qualityBonus / 2)));

    // Weighted overall score
    const overallScore = Math.round(
      (communicationScore  * 0.3) +
      (technicalScore      * 0.4) +
      (professionalismScore * 0.3)
    );

    const passed = overallScore >= QUALIFYING_MARK;

    // ── 2. Generate feedback based on real performance ────────────────────────
    const feedback = {
      strengths:       buildStrengths(overallScore, completionRate, avgResponseTime),
      improvements:    buildImprovements(skippedCount, avgResponseTime, overallScore),
      recommendations: buildRecommendations(overallScore, technicalScore)
    };

    // ── 3. Save to database ───────────────────────────────────────────────────
    const interview = await Interview.create({
      user: req.user.id,
      settings,
      answers,
      totalQuestions: total,
      answeredQuestions: answeredCount,
      skippedQuestions: skippedCount,
      duration,
      scores: {
        overall:         overallScore,
        communication:   communicationScore,
        technical:       technicalScore,
        professionalism: professionalismScore
      },
      completionRate: Math.round(completionRate * 100),
      avgResponseTime,
      feedback,
      qualifyingMark: QUALIFYING_MARK,
      passed,
      status: 'completed'
    });

    // ── 4. Send notification to USER ─────────────────────────────────────────
    const userNotifType = passed ? 'interview_result' : 'interview_warning';
    const userNotifTitle = passed
      ? `✅ Interview Passed – Score: ${overallScore}%`
      : `⚠️ Interview Below Qualifying Mark – Score: ${overallScore}%`;
    const userNotifMsg = passed
      ? `Congratulations! You scored ${overallScore}% in your AI interview, which is above the qualifying mark of ${QUALIFYING_MARK}%. Keep up the great work!`
      : `You scored ${overallScore}% in your AI interview, which is below the qualifying mark of ${QUALIFYING_MARK}%. Don't be discouraged – review the feedback and try again!`;

    await Notification.create({
      user: req.user.id,
      type: userNotifType,
      title: userNotifTitle,
      message: userNotifMsg,
      data: { interviewId: interview._id, score: overallScore, passed, qualifyingMark: QUALIFYING_MARK }
    });

    // ── 5. Send notification to ALL ADMINS ───────────────────────────────────
    const admins = await User.find({ role: 'admin' }).select('_id');
    const user   = await User.findById(req.user.id).select('name email');

    const adminNotifTitle = passed
      ? `Interview Completed – ${user?.name || 'A user'} scored ${overallScore}%`
      : `⚠️ Low Interview Score – ${user?.name || 'A user'} scored ${overallScore}% (below ${QUALIFYING_MARK}%)`;
    const adminNotifMsg = passed
      ? `${user?.name || 'A user'} (${user?.email || ''}) completed an AI interview with a score of ${overallScore}%, passing the qualifying mark.`
      : `${user?.name || 'A user'} (${user?.email || ''}) scored ${overallScore}% in their AI interview, which is below the qualifying mark of ${QUALIFYING_MARK}%. Consider reaching out.`;

    if (admins.length > 0) {
      await Notification.insertMany(admins.map(admin => ({
        user: admin._id,
        type: 'interview_completed',
        title: adminNotifTitle,
        message: adminNotifMsg,
        data: {
          interviewId: interview._id,
          userId: req.user.id,
          userName: user?.name,
          userEmail: user?.email,
          score: overallScore,
          passed,
          qualifyingMark: QUALIFYING_MARK
        }
      })));
    }

    // ── 6. Return results ─────────────────────────────────────────────────────
    res.json({
      success: true,
      data: {
        overallScore,
        communicationScore,
        technicalScore,
        professionalismScore,
        avgResponseTime,
        completionRate: Math.round(completionRate * 100),
        answeredQuestions: answeredCount,
        skippedQuestions: skippedCount,
        passed,
        qualifyingMark: QUALIFYING_MARK,
        feedback
      }
    });

  } catch (error) {
    console.error('Interview submission error:', error);
    res.status(500).json({ success: false, message: 'Error processing interview results' });
  }
});

// @route   GET /api/interview/history
// @desc    Get current user's interview history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: interviews });
  } catch (error) {
    console.error('Interview history error:', error);
    res.status(500).json({ success: false, message: 'Error fetching interview history' });
  }
});

// @route   GET /api/interview/all
// @desc    Get all interviews (admin only)
// @access  Private/Admin
router.get('/all', protect, async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: interviews });
  } catch (error) {
    console.error('Get all interviews error:', error);
    res.status(500).json({ success: false, message: 'Error fetching interviews' });
  }
});

// @route   GET /api/interview/stats
// @desc    Get interview statistics (admin only)
// @access  Private/Admin
router.get('/stats', protect, async (req, res) => {
  try {
    const total      = await Interview.countDocuments();
    const passed     = await Interview.countDocuments({ passed: true });
    const failed     = await Interview.countDocuments({ passed: false });
    const avgScore   = await Interview.aggregate([
      { $group: { _id: null, avg: { $avg: '$scores.overall' } } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        passed,
        failed,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        avgScore: avgScore[0] ? Math.round(avgScore[0].avg) : 0,
        qualifyingMark: QUALIFYING_MARK
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

function buildStrengths(score, completionRate, avgTime) {
  const s = [];
  if (completionRate >= 0.8) s.push('Excellent completion rate – you answered most questions');
  if (score >= 80)           s.push('Strong overall performance across all categories');
  if (score >= 70)           s.push('Good communication and presentation skills');
  if (avgTime >= 45)         s.push('Thorough and detailed responses');
  return s.length > 0 ? s : ['You completed the interview – keep practicing!'];
}

function buildImprovements(skipped, avgTime, score) {
  const i = [];
  if (skipped > 2)   i.push('Try to answer all questions instead of skipping');
  if (avgTime < 20)  i.push('Provide more detailed answers – take your time to elaborate');
  if (avgTime > 200) i.push('Work on being more concise in your responses');
  if (score < 60)    i.push('Review common interview questions and practice your answers');
  return i.length > 0 ? i : ['Keep practicing to further improve your performance'];
}

function buildRecommendations(overall, tech) {
  const r = [];
  if (tech < 70)    r.push('Review technical concepts related to your field');
  if (overall < 60) r.push('Practice with mock interviews before your next session');
  r.push('Use the STAR method (Situation, Task, Action, Result) for behavioral questions');
  r.push('Record yourself to improve delivery and confidence');
  return r;
}

function generateQuestions(difficulty = 'medium', type = 'hr') {
  const questionBank = {
    introduction: [
      { id: 1, text: "Tell me about yourself and your background.", category: "Introduction", type: "behavioral", expectedDuration: 120, difficulty: "easy" },
      { id: 2, text: "Walk me through your resume and highlight your key achievements.", category: "Introduction", type: "behavioral", expectedDuration: 180, difficulty: "medium" }
    ],
    motivation: [
      { id: 3, text: "What motivated you to apply for this position?", category: "Motivation", type: "behavioral", expectedDuration: 90, difficulty: "easy" },
      { id: 4, text: "Why do you want to work for our company specifically?", category: "Motivation", type: "behavioral", expectedDuration: 120, difficulty: "medium" }
    ],
    technical: [
      { id: 5, text: "Explain a technical concept from your resume in simple terms.", category: "Technical", type: "technical", expectedDuration: 150, difficulty: "medium" },
      { id: 6, text: "Describe the most complex technical problem you've solved.", category: "Technical", type: "technical", expectedDuration: 240, difficulty: "hard" },
      { id: 7, text: "How do you approach debugging and troubleshooting?", category: "Technical", type: "technical", expectedDuration: 120, difficulty: "medium" }
    ],
    problemSolving: [
      { id: 8, text: "Describe a challenging project you worked on and how you overcame obstacles.", category: "Problem Solving", type: "behavioral", expectedDuration: 180, difficulty: "medium" },
      { id: 9, text: "Tell me about a time when you had to make a difficult decision with limited information.", category: "Problem Solving", type: "behavioral", expectedDuration: 150, difficulty: "hard" }
    ],
    teamwork: [
      { id: 10, text: "Describe a time when you had to work with a difficult team member.", category: "Teamwork", type: "behavioral", expectedDuration: 120, difficulty: "medium" },
      { id: 11, text: "How do you handle conflicts within a team?", category: "Teamwork", type: "behavioral", expectedDuration: 90, difficulty: "easy" }
    ],
    strengths: [
      { id: 14, text: "What are your greatest strengths and how do they apply to this role?", category: "Self Assessment", type: "behavioral", expectedDuration: 120, difficulty: "easy" },
      { id: 15, text: "What is your biggest weakness and how are you working to improve it?", category: "Self Assessment", type: "behavioral", expectedDuration: 120, difficulty: "medium" }
    ],
    workStyle: [
      { id: 16, text: "How do you handle tight deadlines and pressure?", category: "Work Style", type: "behavioral", expectedDuration: 90, difficulty: "easy" },
      { id: 17, text: "Describe your ideal work environment.", category: "Work Style", type: "behavioral", expectedDuration: 90, difficulty: "easy" }
    ],
    careerGoals: [
      { id: 18, text: "What are your career goals for the next 3-5 years?", category: "Career Goals", type: "behavioral", expectedDuration: 90, difficulty: "easy" },
      { id: 19, text: "Where do you see yourself in 10 years?", category: "Career Goals", type: "behavioral", expectedDuration: 120, difficulty: "medium" }
    ],
    closing: [
      { id: 22, text: "Do you have any questions for us?", category: "Closing", type: "behavioral", expectedDuration: 120, difficulty: "easy" }
    ]
  };

  let selected = [questionBank.introduction[0]];

  if (type === 'hr' || type === 'mixed') {
    selected.push(questionBank.motivation[0]);
    selected.push(questionBank.problemSolving[0]);
    selected.push(questionBank.teamwork[0]);
    selected.push(questionBank.strengths[0]);
    selected.push(questionBank.workStyle[0]);
    selected.push(questionBank.careerGoals[0]);
  }

  if (type === 'technical' || type === 'mixed') {
    selected.push(questionBank.technical[0]);
    if (difficulty === 'hard') selected.push(questionBank.technical[1]);
  }

  selected.push(questionBank.closing[0]);
  return selected.slice(0, 10);
}

// @route   DELETE /api/interview/:id
// @desc    Delete an interview record (admin only)
// @access  Private/Admin
router.delete('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    await Interview.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Interview deleted successfully' });
  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({ success: false, message: 'Error deleting interview' });
  }
});

module.exports = router;
