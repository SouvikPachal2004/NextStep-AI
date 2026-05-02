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
    
    // Try to analyze the resume content
    let resumeAnalysis = null;
    let questions = [];
    
    try {
      // Attempt to extract text from the resume file
      const resumeText = await extractTextFromResume(req.file.path);
      
      if (resumeText && resumeText.length > 50) {
        // Analyze the resume content
        resumeAnalysis = analyzeResumeContent(resumeText);
        
        // Generate questions based on resume analysis
        questions = generateResumeBasedQuestions(resumeAnalysis, difficulty, type);
        
        console.log('Resume analysis successful:', {
          textLength: resumeText.length,
          skillsFound: resumeAnalysis.skills.length,
          questionsGenerated: questions.length
        });
      } else {
        throw new Error('Could not extract sufficient text from resume');
      }
    } catch (analysisError) {
      console.error('Resume analysis failed:', analysisError.message);
      
      // Fallback to enhanced default questions
      questions = generateQuestions(difficulty, type);
      
      resumeAnalysis = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date(),
        analysisStatus: 'fallback',
        error: analysisError.message
      };
    }

    res.json({
      success: true,
      data: {
        resumeAnalysis: resumeAnalysis || {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          uploadedAt: new Date()
        },
        questions,
        totalQuestions: questions.length,
        analysisStatus: resumeAnalysis?.analysisStatus || 'success'
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

// ─── RESUME ANALYSIS FUNCTIONS ────────────────────────────────────────────────

const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractTextFromResume(filePath) {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    
    if (fileExtension === '.pdf') {
      return await extractTextFromPDF(filePath);
    } else if (fileExtension === '.docx' || fileExtension === '.doc') {
      return await extractTextFromWord(filePath);
    } else {
      throw new Error('Unsupported file format');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
}

async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.trim().length < 50) {
      throw new Error('Could not extract sufficient text from PDF');
    }
    
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Could not extract text from PDF: ' + error.message);
  }
}

async function extractTextFromWord(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    
    if (!result.value || result.value.trim().length < 50) {
      throw new Error('Could not extract sufficient text from Word document');
    }
    
    return result.value;
  } catch (error) {
    console.error('Word extraction error:', error);
    throw new Error('Could not extract text from Word document: ' + error.message);
  }
}

function analyzeResumeContent(text) {
  const textLower = text.toLowerCase();
  
  // Extract skills
  const skillKeywords = {
    'Programming Languages': ['java', 'javascript', 'python', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust', 'typescript'],
    'Web Technologies': ['html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'asp.net'],
    'Databases': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'cassandra', 'dynamodb'],
    'Cloud & DevOps': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd'],
    'Tools & Frameworks': ['git', 'github', 'jira', 'agile', 'scrum', 'rest api', 'graphql', 'microservices']
  };
  
  const foundSkills = [];
  const skillCategories = {};
  
  for (const [category, skills] of Object.entries(skillKeywords)) {
    const categorySkills = [];
    for (const skill of skills) {
      if (textLower.includes(skill)) {
        foundSkills.push(skill);
        categorySkills.push(skill);
      }
    }
    if (categorySkills.length > 0) {
      skillCategories[category] = categorySkills;
    }
  }
  
  // Extract experience level
  let experienceLevel = 'Entry Level';
  const experiencePatterns = [
    /(\d+)\+?\s*years?\s*(?:of)?\s*experience/i,
    /experience\s*:?\s*(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*years?\s*in/i
  ];
  
  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match) {
      const years = parseInt(match[1]);
      if (years <= 2) experienceLevel = '0-2 years';
      else if (years <= 5) experienceLevel = '2-5 years';
      else if (years <= 10) experienceLevel = '5-10 years';
      else experienceLevel = '10+ years';
      break;
    }
  }
  
  // Extract education
  let education = 'Not specified';
  if (textLower.includes('phd') || textLower.includes('doctorate')) {
    education = 'PhD / Doctorate';
  } else if (textLower.includes('master') || textLower.includes('m.s') || textLower.includes('mba')) {
    education = "Master's Degree";
  } else if (textLower.includes('bachelor') || textLower.includes('b.s') || textLower.includes('b.tech')) {
    education = "Bachelor's Degree";
  } else if (textLower.includes('diploma') || textLower.includes('associate')) {
    education = 'Diploma / Associate';
  }
  
  // Extract projects
  const hasProjects = textLower.includes('project') || textLower.includes('portfolio');
  
  return {
    skills: foundSkills,
    skillCategories,
    experienceLevel,
    education,
    hasProjects,
    textLength: text.length,
    wordCount: text.split(/\s+/).length
  };
}

function generateResumeBasedQuestions(analysis, difficulty = 'medium', type = 'mixed') {
  const { skills, skillCategories, experienceLevel, education, hasProjects } = analysis;
  
  let questions = [];
  let questionId = 1;
  
  // Always start with introduction
  questions.push({
    id: questionId++,
    text: "Tell me about yourself and walk me through your background and experience as mentioned in your resume.",
    category: "Introduction",
    type: "behavioral",
    expectedDuration: 120
  });
  
  // Generate skill-specific questions
  if (skillCategories['Programming Languages']) {
    const langs = skillCategories['Programming Languages'];
    if (langs.includes('java')) {
      questions.push({
        id: questionId++,
        text: "I see you have Java experience on your resume. Can you explain the difference between abstract classes and interfaces in Java? When would you use each?",
        category: "Java Programming",
        type: "technical",
        expectedDuration: 150
      });
      
      if (difficulty === 'hard') {
        questions.push({
          id: questionId++,
          text: "Your resume mentions Java experience. Explain Java's garbage collection mechanism and how you optimize memory usage in your applications.",
          category: "Java Memory Management",
          type: "technical",
          expectedDuration: 180
        });
      }
    }
    
    if (langs.includes('javascript')) {
      questions.push({
        id: questionId++,
        text: "I notice JavaScript is listed in your skills. Can you explain the concept of closures in JavaScript and provide a practical example?",
        category: "JavaScript",
        type: "technical",
        expectedDuration: 150
      });
    }
    
    if (langs.includes('python')) {
      questions.push({
        id: questionId++,
        text: "Your resume shows Python experience. What are Python decorators and how have you used them in your projects?",
        category: "Python Programming",
        type: "technical",
        expectedDuration: 150
      });
    }
  }
  
  // Database questions based on resume
  if (skillCategories['Databases']) {
    const dbs = skillCategories['Databases'];
    if (dbs.includes('mysql') || dbs.includes('sql')) {
      questions.push({
        id: questionId++,
        text: "Your resume mentions database experience. Can you explain the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN with examples from your work?",
        category: "Database/SQL",
        type: "technical",
        expectedDuration: 150
      });
    }
    
    if (dbs.includes('mongodb')) {
      questions.push({
        id: questionId++,
        text: "I see MongoDB on your resume. How does MongoDB differ from relational databases, and when would you choose it over SQL databases?",
        category: "NoSQL Databases",
        type: "technical",
        expectedDuration: 150
      });
    }
  }
  
  // Web technology questions
  if (skillCategories['Web Technologies']) {
    const webTech = skillCategories['Web Technologies'];
    if (webTech.includes('react')) {
      questions.push({
        id: questionId++,
        text: "Your resume shows React experience. Can you explain the React component lifecycle and how you've used hooks in your projects?",
        category: "React Development",
        type: "technical",
        expectedDuration: 180
      });
    }
    
    if (webTech.includes('node.js')) {
      questions.push({
        id: questionId++,
        text: "I notice Node.js in your skill set. How do you handle asynchronous operations in Node.js, and what's the difference between callbacks, promises, and async/await?",
        category: "Node.js Backend",
        type: "technical",
        expectedDuration: 180
      });
    }
  }
  
  // Experience-based questions
  if (experienceLevel !== 'Entry Level') {
    questions.push({
      id: questionId++,
      text: `Based on your ${experienceLevel.toLowerCase()} of experience, tell me about the most challenging technical problem you've solved. What was your approach and what technologies did you use?`,
      category: "Problem Solving",
      type: "behavioral",
      expectedDuration: 200
    });
    
    questions.push({
      id: questionId++,
      text: "With your experience, how do you ensure code quality in your projects? What testing strategies and code review processes have you implemented?",
      category: "Code Quality & Best Practices",
      type: "technical",
      expectedDuration: 150
    });
  }
  
  // Project-based questions
  if (hasProjects) {
    questions.push({
      id: questionId++,
      text: "I see you have projects mentioned in your resume. Can you walk me through one of your most significant projects? What technologies did you use and what challenges did you face?",
      category: "Project Experience",
      type: "behavioral",
      expectedDuration: 200
    });
  }
  
  // Cloud/DevOps questions if relevant
  if (skillCategories['Cloud & DevOps']) {
    const cloudSkills = skillCategories['Cloud & DevOps'];
    if (cloudSkills.includes('aws') || cloudSkills.includes('azure') || cloudSkills.includes('gcp')) {
      questions.push({
        id: questionId++,
        text: "Your resume mentions cloud experience. Can you explain the benefits of cloud computing and describe a project where you've used cloud services?",
        category: "Cloud Computing",
        type: "technical",
        expectedDuration: 150
      });
    }
    
    if (cloudSkills.includes('docker')) {
      questions.push({
        id: questionId++,
        text: "I see Docker in your skills. What are containers and how do they differ from virtual machines? How have you used Docker in your projects?",
        category: "DevOps & Containerization",
        type: "technical",
        expectedDuration: 150
      });
    }
  }
  
  // Behavioral questions based on experience level
  if (type === 'hr' || type === 'mixed') {
    questions.push({
      id: questionId++,
      text: "Based on your background, how do you stay updated with new technologies and programming trends? Can you mention a recent technology you learned?",
      category: "Continuous Learning",
      type: "behavioral",
      expectedDuration: 120
    });
    
    if (experienceLevel !== 'Entry Level') {
      questions.push({
        id: questionId++,
        text: "With your experience working in teams, how do you handle code reviews and technical disagreements with colleagues?",
        category: "Teamwork & Communication",
        type: "behavioral",
        expectedDuration: 120
      });
    }
  }
  
  // Career goals question
  questions.push({
    id: questionId++,
    text: `Given your background in ${skills.slice(0, 3).join(', ')}, where do you see yourself in your technical career in the next 3-5 years? What technologies do you want to master?`,
    category: "Career Goals",
    type: "behavioral",
    expectedDuration: 120
  });
  
  // Ensure we have at least 8 questions but not more than 10
  if (questions.length < 8) {
    // Add some general technical questions to fill up
    const generalQuestions = [
      {
        id: questionId++,
        text: "What is your approach to debugging code? Can you walk me through your debugging process?",
        category: "Problem Solving",
        type: "technical",
        expectedDuration: 120
      },
      {
        id: questionId++,
        text: "How do you approach learning a new technology or framework? Can you give me an example?",
        category: "Learning Approach",
        type: "behavioral",
        expectedDuration: 120
      }
    ];
    
    questions.push(...generalQuestions.slice(0, 8 - questions.length));
  }
  
  return questions.slice(0, 10); // Limit to 10 questions
}

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
      { id: 1, text: "Tell me about yourself and walk me through your technical background and experience.", category: "Introduction", type: "behavioral", expectedDuration: 120, difficulty: "easy" },
      { id: 2, text: "Walk me through your resume and highlight your key technical achievements and projects.", category: "Introduction", type: "behavioral", expectedDuration: 180, difficulty: "medium" }
    ],
    
    // Java-specific questions
    javaQuestions: [
      { id: 3, text: "Explain the difference between abstract classes and interfaces in Java. When would you use each?", category: "Java Programming", type: "technical", expectedDuration: 150, difficulty: "medium" },
      { id: 4, text: "What is the difference between ArrayList and LinkedList in Java? When would you choose one over the other?", category: "Java Collections", type: "technical", expectedDuration: 120, difficulty: "medium" },
      { id: 5, text: "Explain Java's garbage collection mechanism and how you can optimize memory usage in your applications.", category: "Java Memory Management", type: "technical", expectedDuration: 180, difficulty: "hard" },
      { id: 6, text: "What are Java Streams and how do they improve code readability? Can you give an example?", category: "Java 8+ Features", type: "technical", expectedDuration: 150, difficulty: "medium" },
      { id: 7, text: "Explain the concept of multithreading in Java. How do you handle thread synchronization?", category: "Java Concurrency", type: "technical", expectedDuration: 200, difficulty: "hard" }
    ],
    
    // MySQL/Database questions
    databaseQuestions: [
      { id: 8, text: "Explain the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN in MySQL with examples.", category: "MySQL/Database", type: "technical", expectedDuration: 150, difficulty: "medium" },
      { id: 9, text: "What are database indexes and how do they improve query performance? What are the trade-offs?", category: "Database Optimization", type: "technical", expectedDuration: 180, difficulty: "medium" },
      { id: 10, text: "Explain ACID properties in database transactions. Why are they important?", category: "Database Theory", type: "technical", expectedDuration: 150, difficulty: "hard" },
      { id: 11, text: "How would you optimize a slow-running MySQL query? What tools and techniques would you use?", category: "Database Performance", type: "technical", expectedDuration: 200, difficulty: "hard" },
      { id: 12, text: "What is database normalization? Explain the different normal forms with examples.", category: "Database Design", type: "technical", expectedDuration: 180, difficulty: "medium" }
    ],
    
    // Web Development questions
    webDevQuestions: [
      { id: 13, text: "Explain the difference between REST and SOAP APIs. What are the advantages of RESTful services?", category: "Web APIs", type: "technical", expectedDuration: 150, difficulty: "medium" },
      { id: 14, text: "What is the difference between HTTP and HTTPS? How does SSL/TLS work?", category: "Web Security", type: "technical", expectedDuration: 120, difficulty: "medium" },
      { id: 15, text: "Explain how you would implement authentication and authorization in a web application.", category: "Web Security", type: "technical", expectedDuration: 180, difficulty: "hard" },
      { id: 16, text: "What are microservices? What are the advantages and challenges of microservice architecture?", category: "System Architecture", type: "technical", expectedDuration: 200, difficulty: "hard" }
    ],
    
    // Programming concepts
    programmingConcepts: [
      { id: 17, text: "Explain the difference between object-oriented and functional programming. Give examples of when to use each.", category: "Programming Paradigms", type: "technical", expectedDuration: 150, difficulty: "medium" },
      { id: 18, text: "What are design patterns? Explain the Singleton and Factory patterns with examples.", category: "Design Patterns", type: "technical", expectedDuration: 180, difficulty: "medium" },
      { id: 19, text: "Explain Big O notation and analyze the time complexity of common algorithms like binary search and merge sort.", category: "Algorithms", type: "technical", expectedDuration: 200, difficulty: "hard" },
      { id: 20, text: "What is the difference between stack and heap memory? How does memory allocation work?", category: "Memory Management", type: "technical", expectedDuration: 150, difficulty: "medium" }
    ],
    
    // Project-based questions
    projectQuestions: [
      { id: 21, text: "Describe the most challenging technical project you've worked on. What technologies did you use and what problems did you solve?", category: "Project Experience", type: "behavioral", expectedDuration: 240, difficulty: "medium" },
      { id: 22, text: "Tell me about a time when you had to learn a new technology quickly for a project. How did you approach it?", category: "Learning & Adaptation", type: "behavioral", expectedDuration: 180, difficulty: "medium" },
      { id: 23, text: "Describe a situation where you had to debug a complex issue in production. What was your approach?", category: "Problem Solving", type: "behavioral", expectedDuration: 200, difficulty: "medium" },
      { id: 24, text: "How do you ensure code quality in your projects? What testing strategies do you use?", category: "Code Quality", type: "technical", expectedDuration: 150, difficulty: "medium" }
    ],
    
    // Teamwork and soft skills
    teamworkQuestions: [
      { id: 25, text: "Describe your experience working in an Agile/Scrum environment. How do you handle sprint planning and code reviews?", category: "Teamwork", type: "behavioral", expectedDuration: 150, difficulty: "medium" },
      { id: 26, text: "Tell me about a time when you had to explain a complex technical concept to a non-technical stakeholder.", category: "Communication", type: "behavioral", expectedDuration: 120, difficulty: "medium" },
      { id: 27, text: "How do you handle disagreements with team members about technical decisions?", category: "Conflict Resolution", type: "behavioral", expectedDuration: 120, difficulty: "medium" }
    ],
    
    // Career and growth
    careerQuestions: [
      { id: 28, text: "What programming languages and technologies are you most excited to learn next? Why?", category: "Career Growth", type: "behavioral", expectedDuration: 90, difficulty: "easy" },
      { id: 29, text: "How do you stay updated with the latest technology trends and best practices in software development?", category: "Continuous Learning", type: "behavioral", expectedDuration: 120, difficulty: "easy" },
      { id: 30, text: "Where do you see yourself in your technical career in the next 3-5 years? What kind of projects do you want to work on?", category: "Career Goals", type: "behavioral", expectedDuration: 120, difficulty: "easy" }
    ],
    
    closing: [
      { id: 31, text: "Do you have any questions about the role, the team, or the technology stack we use?", category: "Closing", type: "behavioral", expectedDuration: 120, difficulty: "easy" }
    ]
  };

  let selected = [];
  
  // Always start with introduction
  selected.push(questionBank.introduction[0]);
  
  // Select questions based on type and difficulty
  if (type === 'technical' || type === 'mixed') {
    // Add Java questions
    selected.push(...getRandomQuestions(questionBank.javaQuestions, 2, difficulty));
    
    // Add Database questions
    selected.push(...getRandomQuestions(questionBank.databaseQuestions, 2, difficulty));
    
    // Add Web Development questions
    selected.push(...getRandomQuestions(questionBank.webDevQuestions, 1, difficulty));
    
    // Add Programming concepts
    selected.push(...getRandomQuestions(questionBank.programmingConcepts, 1, difficulty));
  }
  
  if (type === 'hr' || type === 'mixed') {
    // Add project-based questions
    selected.push(...getRandomQuestions(questionBank.projectQuestions, 2, difficulty));
    
    // Add teamwork questions
    selected.push(...getRandomQuestions(questionBank.teamworkQuestions, 1, difficulty));
  }
  
  // Add career questions
  selected.push(...getRandomQuestions(questionBank.careerQuestions, 1, difficulty));
  
  // Always end with closing
  selected.push(questionBank.closing[0]);
  
  // Limit to 10 questions and ensure unique IDs
  return selected.slice(0, 10).map((q, index) => ({ ...q, id: index + 1 }));
}

// Helper function to get random questions based on difficulty
function getRandomQuestions(questionArray, count, difficulty) {
  let filteredQuestions = questionArray;
  
  // Filter by difficulty if specified
  if (difficulty === 'easy') {
    filteredQuestions = questionArray.filter(q => q.difficulty === 'easy' || q.difficulty === 'medium');
  } else if (difficulty === 'hard') {
    filteredQuestions = questionArray.filter(q => q.difficulty === 'medium' || q.difficulty === 'hard');
  }
  
  // If not enough questions after filtering, use all
  if (filteredQuestions.length < count) {
    filteredQuestions = questionArray;
  }
  
  // Shuffle and return requested count
  const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// @route   PUT /api/interview/:id/remarks
// @desc    Add admin remarks to an interview (admin only)
// @access  Private/Admin
router.put('/:id/remarks', protect, async (req, res) => {
  try {
    const { remarks } = req.body;
    
    if (!remarks || typeof remarks !== 'string') {
      return res.status(400).json({ success: false, message: 'Remarks text is required' });
    }
    
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    // Update the interview with admin remarks
    interview.adminRemarks = remarks.trim();
    await interview.save();
    
    // Send notification to the user about the admin feedback
    const user = await User.findById(interview.user).select('name email');
    if (user) {
      await Notification.create({
        user: interview.user,
        type: 'admin_feedback',
        title: '📝 Admin Feedback Received',
        message: `You have received feedback from an admin regarding your interview performance. Check your interview history to view the remarks.`,
        data: { 
          interviewId: interview._id,
          adminRemarks: remarks.trim()
        }
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Admin remarks added successfully',
      data: { 
        interviewId: interview._id,
        adminRemarks: interview.adminRemarks
      }
    });
    
  } catch (error) {
    console.error('Add admin remarks error:', error);
    res.status(500).json({ success: false, message: 'Error adding admin remarks' });
  }
});

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
