const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'NextStep AI ML Service is running'
  });
});

// Resume analysis
app.post('/api/ml/resume/analyze', (req, res) => {
  try {
    const { text = '' } = req.body;
    
    // Simple skill extraction
    const skills = [];
    const skillList = ['python', 'java', 'javascript', 'react', 'node', 'html', 'css', 'sql', 'mongodb', 'aws'];
    
    skillList.forEach(skill => {
      if (text.toLowerCase().includes(skill)) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });
    
    // Simple ATS score calculation
    let score = 40;
    if (text.toLowerCase().includes('experience')) score += 20;
    if (text.toLowerCase().includes('education')) score += 15;
    if (text.toLowerCase().includes('skills')) score += 10;
    if (skills.length > 3) score += 15;
    
    const analysis = {
      atsScore: Math.min(score, 100),
      skills: skills,
      skillCount: skills.length,
      wordCount: text.split(' ').length,
      recommendations: [
        'Add more technical skills to your resume',
        'Include quantified achievements',
        'Add a projects section showcasing your work',
        'Use action verbs in job descriptions'
      ].slice(0, 3)
    };
    
    res.json({
      success: true,
      analysis: analysis
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Skills extraction
app.post('/api/ml/resume/extract-skills', (req, res) => {
  try {
    const { text = '' } = req.body;
    
    const skills = [];
    const skillList = ['python', 'java', 'javascript', 'react', 'node', 'html', 'css', 'sql', 'mongodb', 'aws'];
    
    skillList.forEach(skill => {
      if (text.toLowerCase().includes(skill)) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });
    
    res.json({
      success: true,
      skills: skills
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Job matching
app.post('/api/ml/jobs/match', (req, res) => {
  try {
    const { userSkills = [], jobs = [] } = req.body;
    
    const matches = jobs.map(job => {
      const jobSkills = job.requiredSkills || [];
      const matchedSkills = userSkills.filter(skill => 
        jobSkills.some(jobSkill => 
          jobSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      
      const matchPercentage = jobSkills.length > 0 
        ? (matchedSkills.length / jobSkills.length) * 100 
        : 0;
      
      return {
        jobId: job._id,
        matchPercentage: Math.round(matchPercentage * 10) / 10,
        matchedSkills: matchedSkills
      };
    });
    
    res.json({
      success: true,
      matches: matches
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 ML Service running on port ${PORT}`);
});