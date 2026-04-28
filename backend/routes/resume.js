const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resumes/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

// @route   POST /api/resume/upload
// @desc    Upload resume
// @access  Private
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading resume' });
  }
});

// @route   POST /api/resume/analyze
// @desc    Analyze resume with ML service
// @access  Private
router.post('/analyze', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume' });
    }

    // ── Try ML service first (richer analysis) ──────────────────────────────
    const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    try {
      const axios = require('axios');
      const fs = require('fs');
      const FormData = require('form-data');

      const form = new FormData();
      form.append('file', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      const mlResponse = await axios.post(`${ML_URL}/api/ml/resume/analyze`, form, {
        headers: form.getHeaders(),
        timeout: 15000
      });

      if (mlResponse.data && mlResponse.data.success) {
        const mlAnalysis = mlResponse.data.analysis;

        // Build ATS breakdown from ML analysis
        const atsScore = mlAnalysis.atsScore || 0;
        const atsBreakdown = mlAnalysis.atsBreakdown || {
          sections:   Math.min(40, Math.round(atsScore * 0.40)),
          contact:    Math.min(20, Math.round(atsScore * 0.20)),
          skills:     Math.min(20, Math.round(atsScore * 0.20)),
          formatting: Math.min(15, Math.round(atsScore * 0.15)),
          keywords:   Math.min(5,  Math.round(atsScore * 0.05))
        };

        // Map ML response to our standard format
        const analysis = {
          skills: mlAnalysis.skills || [],
          experience: mlAnalysis.experienceLevel || 'Not specified',
          education: mlAnalysis.education || 'Not specified',
          atsScore: atsScore,
          atsBreakdown: atsBreakdown,
          skillCategories: mlAnalysis.skillCategories || {},
          wordCount: mlAnalysis.wordCount || 0,
          jobMatches: buildJobMatches(mlAnalysis.skills || []),
          suggestions: mlAnalysis.recommendations || []
        };

        return res.json({ success: true, data: analysis, source: 'ml' });
      }
    } catch (mlError) {
      console.log('ML service unavailable, falling back to local analysis:', mlError.message);
    }

    // ── Fallback: local analysis ─────────────────────────────────────────────
    const fs = require('fs');
    const pdfParse = require('pdf-parse');
    
    // Read and parse PDF
    let resumeText = '';
    try {
      if (req.file.mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        resumeText = pdfData.text.toLowerCase();
      } else {
        resumeText = fs.readFileSync(req.file.path, 'utf8').toLowerCase();
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return res.status(400).json({ success: false, message: 'Could not parse resume file' });
    }

    // Skill detection
    const skillKeywords = {
      'javascript': 'JavaScript', 'js': 'JavaScript', 'typescript': 'TypeScript',
      'python': 'Python', 'java': 'Java', 'c++': 'C++', 'c#': 'C#',
      'react': 'React', 'angular': 'Angular', 'vue': 'Vue.js',
      'node': 'Node.js', 'nodejs': 'Node.js', 'express': 'Express.js',
      'mongodb': 'MongoDB', 'mysql': 'MySQL', 'postgresql': 'PostgreSQL',
      'aws': 'AWS', 'azure': 'Azure', 'docker': 'Docker', 'kubernetes': 'Kubernetes',
      'git': 'Git', 'html': 'HTML', 'css': 'CSS', 'sql': 'SQL',
      'rest': 'REST API', 'api': 'API Development', 'graphql': 'GraphQL',
      'machine learning': 'Machine Learning', 'ml': 'Machine Learning',
      'data science': 'Data Science', 'ai': 'Artificial Intelligence',
      'django': 'Django', 'flask': 'Flask', 'spring': 'Spring Boot',
      'redux': 'Redux', 'webpack': 'Webpack', 'babel': 'Babel'
    };
    
    const detectedSkills = [];
    for (const [keyword, skill] of Object.entries(skillKeywords)) {
      if (resumeText.includes(keyword) && !detectedSkills.includes(skill)) {
        detectedSkills.push(skill);
      }
    }

    // Experience level detection - use the already-extracted text
    let experience = 'Fresher';
    const rawText = resumeText; // already lowercased
    const experiencePatterns = [
      /(\d+)\+?\s*(years?|yrs?)\s*(of)?\s*experience/i,
      /experience\s*:?\s*(\d+)\+?\s*(years?|yrs?)/i,
      /(\d+)\+?\s*(years?|yrs?)\s*in/i
    ];
    
    for (const pattern of experiencePatterns) {
      const match = rawText.match(pattern);
      if (match) {
        const years = parseInt(match[1]);
        if (years === 0) {
          experience = 'Fresher';
        } else if (years <= 2) {
          experience = '0-2 years';
        } else if (years <= 5) {
          experience = '2-5 years';
        } else if (years <= 10) {
          experience = '5-10 years';
        } else {
          experience = '10+ years';
        }
        break;
      }
    }
    
    // Override with explicit fresher indicators
    if (rawText.includes('fresher') || rawText.includes('recent graduate') || 
        rawText.includes('entry level') || rawText.includes('seeking first') ||
        rawText.includes('0 year') || rawText.includes('no experience')) {
      experience = 'Fresher';
    }

    // Education detection
    let education = 'Not specified';
    if (resumeText.includes('phd') || resumeText.includes('ph.d') || resumeText.includes('doctorate')) {
      education = 'PhD';
    } else if (resumeText.includes('master') || resumeText.includes('m.s') || resumeText.includes('m.tech') || resumeText.includes('mba')) {
      education = "Master's Degree";
    } else if (resumeText.includes('bachelor') || resumeText.includes('b.s') || resumeText.includes('b.tech') || resumeText.includes('b.e')) {
      education = "Bachelor's Degree";
    } else if (resumeText.includes('diploma') || resumeText.includes('associate')) {
      education = 'Diploma/Associate';
    }

    // Job matching based on skills
    const jobMatches = [];
    if (detectedSkills.length > 0) {
      const webSkills = ['JavaScript', 'React', 'Angular', 'Vue.js', 'HTML', 'CSS'];
      const backendSkills = ['Node.js', 'Python', 'Java', 'Express.js', 'Django', 'Spring Boot'];
      const dataSkills = ['Python', 'Machine Learning', 'Data Science', 'SQL'];
      const devopsSkills = ['Docker', 'Kubernetes', 'AWS', 'Azure'];
      
      const webMatch = detectedSkills.filter(s => webSkills.includes(s)).length;
      const backendMatch = detectedSkills.filter(s => backendSkills.includes(s)).length;
      const dataMatch = detectedSkills.filter(s => dataSkills.includes(s)).length;
      const devopsMatch = detectedSkills.filter(s => devopsSkills.includes(s)).length;
      
      if (webMatch > 0 && backendMatch > 0) {
        jobMatches.push({ title: 'Full Stack Developer', match: Math.min(95, 70 + (webMatch + backendMatch) * 5) });
      }
      if (webMatch > 0) {
        jobMatches.push({ title: 'Frontend Developer', match: Math.min(95, 65 + webMatch * 8) });
      }
      if (backendMatch > 0) {
        jobMatches.push({ title: 'Backend Developer', match: Math.min(95, 65 + backendMatch * 8) });
      }
      if (dataMatch > 1) {
        jobMatches.push({ title: 'Data Scientist', match: Math.min(95, 60 + dataMatch * 10) });
      }
      if (devopsMatch > 1) {
        jobMatches.push({ title: 'DevOps Engineer', match: Math.min(95, 60 + devopsMatch * 10) });
      }
    }
    
    // Sort by match percentage
    jobMatches.sort((a, b) => b.match - a.match);

    // Generate suggestions based on analysis
    const suggestions = [];
    if (detectedSkills.length < 5) {
      suggestions.push('Add more technical skills relevant to your target role');
    }
    if (experience === 'Fresher') {
      suggestions.push('Highlight academic projects, internships, and relevant coursework');
      suggestions.push('Include any certifications or online courses completed');
    } else {
      suggestions.push('Add quantifiable achievements (e.g., "Improved performance by 40%")');
    }
    if (!resumeText.includes('project')) {
      suggestions.push('Include detailed project descriptions with technologies used');
    }
    if (!resumeText.includes('github') && !resumeText.includes('portfolio')) {
      suggestions.push('Add links to your GitHub profile or portfolio website');
    }
    suggestions.push('Use action verbs to describe your responsibilities and achievements');

    // ── ATS Score calculation (mirrors ML service logic) ──────────────────────
    let atsScore = 0;

    // Standard sections (40 pts)
    const atsSections = ['experience', 'education', 'skills', 'projects'];
    for (const sec of atsSections) {
      if (resumeText.includes(sec)) atsScore += 10;
    }

    // Contact info (20 pts)
    const emailMatch = resumeText.match(/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i);
    const phoneMatch = resumeText.match(/(\+?\d[\d\s\-().]{7,}\d)/);
    if (emailMatch) atsScore += 10;
    if (phoneMatch) atsScore += 10;

    // Skills count (20 pts)
    if (detectedSkills.length >= 8) atsScore += 20;
    else if (detectedSkills.length >= 5) atsScore += 15;
    else if (detectedSkills.length >= 3) atsScore += 10;

    // Formatting / length (20 pts)
    const nonEmptyLines = resumeText.split('\n').filter(l => l.trim().length > 0);
    if (nonEmptyLines.length > 20) atsScore += 10;
    if (/[•\-*]/.test(resumeText)) atsScore += 5;

    // Bonus: action verbs, links, certifications
    if (/achieved|improved|increased|reduced|developed|led|managed|built|designed/i.test(resumeText)) atsScore += 3;
    if (/github|linkedin|portfolio/i.test(resumeText)) atsScore += 2;

    atsScore = Math.min(atsScore, 100);

    // ATS-specific suggestions
    if (atsScore < 50) {
      suggestions.unshift('Your ATS score is low — add standard sections: Summary, Experience, Education, Skills, Projects');
    } else if (atsScore < 70) {
      suggestions.unshift('Improve ATS score by adding more structured sections and industry keywords');
    }

    // ATS breakdown for frontend display
    const atsBreakdown = {
      sections:    atsSections.filter(s => resumeText.includes(s)).length * 10,
      contact:     (emailMatch ? 10 : 0) + (phoneMatch ? 10 : 0),
      skills:      detectedSkills.length >= 8 ? 20 : detectedSkills.length >= 5 ? 15 : detectedSkills.length >= 3 ? 10 : 0,
      formatting:  (nonEmptyLines.length > 20 ? 10 : 0) + (/[•\-*]/.test(resumeText) ? 5 : 0),
      keywords:    (/achieved|improved|increased|reduced|developed|led|managed|built|designed/i.test(resumeText) ? 3 : 0) +
                   (/github|linkedin|portfolio/i.test(resumeText) ? 2 : 0)
    };

    const analysis = {
      skills: detectedSkills.length > 0 ? detectedSkills.slice(0, 10) : ['No skills detected'],
      experience: experience,
      education: education,
      atsScore: atsScore,
      atsBreakdown: atsBreakdown,
      jobMatches: jobMatches.length > 0 ? jobMatches.slice(0, 5) : [
        { title: 'Entry Level Developer', match: 50 }
      ],
      suggestions: suggestions
    };

    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ success: false, message: 'Error analyzing resume' });
  }
});

module.exports = router;
