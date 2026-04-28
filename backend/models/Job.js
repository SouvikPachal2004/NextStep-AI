const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  company: {
    name: { type: String, required: true },
    logo: String,
    website: String
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  requirements: [{
    type: String
  }],
  responsibilities: [{
    type: String
  }],
  skills: [{
    type: String,
    required: true
  }],
  location: {
    type: String,
    required: true
  },
  workType: {
    type: String,
    enum: ['Remote', 'Hybrid', 'On-site'],
    default: 'Remote'
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time'
  },
  experience: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 10 }
  },
  salary: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Programming', 'Data Science', 'Web Development', 'Machine Learning', 'AI', 'Other'],
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationLink: {
    type: String,
    default: ''
  },
  applications: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'],
      default: 'pending'
    },
    matchScore: Number,
    adminNote: { type: String, default: '' }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate match score for a user
jobSchema.methods.calculateMatchScore = function(userSkills) {
  if (!userSkills || userSkills.length === 0) return 0;
  
  const jobSkills = this.skills.map(s => s.toLowerCase());
  const matchingSkills = userSkills.filter(skill => 
    jobSkills.includes(skill.toLowerCase())
  );
  
  const matchScore = Math.round((matchingSkills.length / jobSkills.length) * 100);
  return matchScore;
};

module.exports = mongoose.model('Job', jobSchema);
