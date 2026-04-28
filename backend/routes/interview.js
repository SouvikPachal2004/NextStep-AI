const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resumes/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// @route   POST /api/interview/analyze-resume
// @desc    Analyze resume and generate interview questions
// @access  Private
router.post('/analyze-resume', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file'
      });
    }

    const { difficulty, type } = req.body;
    
    // In production, integrate with AI service (OpenAI, etc.) to analyze resume
    // For now, return sample questions based on difficulty and type
    
    const questions = generateQuestions(difficulty, type);
    
    res.json({
      success: true,
      data: {
        resumeAnalysis: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          uploadedAt: new Date()
        },
        questions: questions,
        totalQuestions: questions.length
      }
    });
    
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing resume'
    });
  }
});

// Generate interview questions based on difficulty and type
function generateQuestions(difficulty = 'medium', type = 'hr') {
  const questionBank = {
    introduction: [
      {
        id: 1,
        text: "Tell me about yourself and your background.",
        category: "Introduction",
        type: "behavioral",
        expectedDuration: 120,
        difficulty: "easy"
      },
      {
        id: 2,
        text: "Walk me through your resume and highlight your key achievements.",
        category: "Introduction",
        type: "behavioral",
        expectedDuration: 180,
        difficulty: "medium"
      }
    ],
    motivation: [
      {
        id: 3,
        text: "What motivated you to apply for this position?",
        category: "Motivation",
        type: "behavioral",
        expectedDuration: 90,
        difficulty: "easy"
      },
      {
        id: 4,
        text: "Why do you want to work for our company specifically?",
        category: "Motivation",
        type: "behavioral",
        expectedDuration: 120,
        difficulty: "medium"
      }
    ],
    technical: [
      {
        id: 5,
        text: "Explain a technical concept from your resume in simple terms.",
        category: "Technical",
        type: "technical",
        expectedDuration: 150,
        difficulty: "medium"
      },
      {
        id: 6,
        text: "Describe the most complex technical problem you've solved.",
        category: "Technical",
        type: "technical",
        expectedDuration: 240,
        difficulty: "hard"
      },
      {
        id: 7,
        text: "How do you approach debugging and troubleshooting?",
        category: "Technical",
        type: "technical",
        expectedDuration: 120,
        difficulty: "medium"
      }
    ],
    problemSolving: [
      {
        id: 8,
        text: "Describe a challenging project you worked on and how you overcame obstacles.",
        category: "Problem Solving",
        type: "behavioral",
        expectedDuration: 180,
        difficulty: "medium"
      },
      {
        id: 9,
        text: "Tell me about a time when you had to make a difficult decision with limited information.",
        category: "Problem Solving",
        type: "behavioral",
        expectedDuration: 150,
        difficulty: "hard"
      }
    ],
    teamwork: [
      {
        id: 10,
        text: "Describe a time when you had to work with a difficult team member.",
        category: "Teamwork",
        type: "behavioral",
        expectedDuration: 120,
        difficulty: "medium"
      },
      {
        id: 11,
        text: "How do you handle conflicts within a team?",
        category: "Teamwork",
        type: "behavioral",
        expectedDuration: 90,
        difficulty: "easy"
      }
    ],
    leadership: [
      {
        id: 12,
        text: "Describe a situation where you had to lead a team or project.",
        category: "Leadership",
        type: "behavioral",
        expectedDuration: 150,
        difficulty: "medium"
      },
      {
        id: 13,
        text: "How do you motivate team members who are underperforming?",
        category: "Leadership",
        type: "behavioral",
        expectedDuration: 120,
        difficulty: "hard"
      }
    ],
    strengths: [
      {
        id: 14,
        text: "What are your greatest strengths and how do they apply to this role?",
        category: "Self Assessment",
        type: "behavioral",
        expectedDuration: 120,
        difficulty: "easy"
      },
      {
        id: 15,
        text: "What is your biggest weakness and how are you working to improve it?",
        category: "Self Assessment",
        type: "behavioral",
        expectedDuration: 120,
        difficulty: "medium"
      }
    ],
    workStyle: [
      {
        id: 16,
        text: "How do you handle tight deadlines and pressure?",
        category: "Work Style",
        type: "behavioral",
        expectedDuration: 90,
        difficulty: "easy"
      },
      {
        id: 17,
        text: "Describe your ideal work environment.",
        category: "Work Style",
        type: "behavioral",
        expectedDuration: 90,
        difficulty: "easy"
      }
    ],
    careerGoals: [
      {
        id: 18,
        text: "What are your career goals for the next 3-5 years?",
        category: "Career Goals",
        type: "behavioral",
        expectedDuration: 90,
        difficulty: "easy"
      },
      {
        id: 19,
        text: "Where do you see yourself in 10 years?",
        category: "Career Goals",
        type: "behavioral",
        expectedDuration: 120,
        difficulty: "medium"
      }
    ],
    learning: [
      {
        id: 20,
        text: "How do you stay updated with industry trends and technologies?",
        category: "Learning",
        type: "behavioral",
        expectedDuration: 90,
        difficulty: "easy"
      },
      {
        id: 21,
        text: "Describe a time when you had to learn a new skill quickly.",
        category: "Learning",
        type: "behavioral",
        expectedDuration: 120,
        difficulty: "medium"
      }
    ],
    closing: [
      {
        id: 22,
        text: "Do you have any questions for us?",
        category: "Closing",
        type: "behavioral",
        expectedDuration: 120,
        difficulty: "easy"
      },
      {
        id: 23,
        text: "Is there anything else you'd like us to know about you?",
        category: "Closing",
        type: "behavioral",
        expectedDuration: 90,
        difficulty: "easy"
      }
    ]
  };

  // Select questions based on type and difficulty
  let selectedQuestions = [];
  
  // Always include introduction
  selectedQuestions.push(questionBank.introduction[0]);
  
  if (type === 'hr' || type === 'behavioral') {
    selectedQuestions.push(questionBank.motivation[0]);
    selectedQuestions.push(questionBank.problemSolving[0]);
    selectedQuestions.push(questionBank.teamwork[0]);
    selectedQuestions.push(questionBank.strengths[0]);
    selectedQuestions.push(questionBank.workStyle[0]);
    selectedQuestions.push(questionBank.careerGoals[0]);
    selectedQuestions.push(questionBank.learning[0]);
  }
  
  if (type === 'technical' || type === 'hr') {
    selectedQuestions.push(questionBank.technical[0]);
    if (difficulty === 'hard') {
      selectedQuestions.push(questionBank.technical[1]);
    }
  }
  
  // Always include closing
  selectedQuestions.push(questionBank.closing[0]);
  
  return selectedQuestions.slice(0, 10); // Limit to 10 questions
}

// @route   POST /api/interview/submit
// @desc    Submit interview answers and get results
// @access  Private
router.post('/submit', protect, async (req, res) => {
  try {
    const { answers, duration, settings } = req.body;
    
    // In production, analyze answers using AI
    // For now, generate sample results
    
    const results = {
      overallScore: Math.floor(75 + Math.random() * 20),
      communicationScore: Math.floor(80 + Math.random() * 15),
      technicalScore: Math.floor(70 + Math.random() * 25),
      professionalismScore: Math.floor(85 + Math.random() * 10),
      avgResponseTime: (2 + Math.random() * 2).toFixed(1),
      completionRate: (answers.length / 10) * 100,
      feedback: {
        strengths: [
          "Excellent communication skills",
          "Clear and structured answers",
          "Good technical knowledge",
          "Strong problem-solving abilities"
        ],
        improvements: [
          "Provide more specific examples",
          "Reduce filler words",
          "Maintain consistent eye contact"
        ],
        recommendations: [
          "Practice behavioral questions using STAR method",
          "Review advanced technical concepts",
          "Work on concise communication"
        ]
      }
    };
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Interview submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing interview results'
    });
  }
});

// @route   GET /api/interview/history
// @desc    Get user's interview history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    // In production, fetch from database
    // For now, return sample data
    
    const history = [
      {
        id: 1,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        type: 'HR + Technical',
        duration: 30,
        score: 85,
        status: 'completed'
      },
      {
        id: 2,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        type: 'Technical',
        duration: 45,
        score: 78,
        status: 'completed'
      }
    ];
    
    res.json({
      success: true,
      data: history
    });
    
  } catch (error) {
    console.error('Interview history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interview history'
    });
  }
});

module.exports = router;
