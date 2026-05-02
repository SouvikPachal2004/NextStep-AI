const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    duration: { type: Number, default: 30 },
    difficulty: { type: String, default: 'medium' },
    type: { type: String, default: 'hr' }
  },
  answers: [{
    questionId: Number,
    question: String,
    duration: Number,
    skipped: { type: Boolean, default: false },
    timestamp: String
  }],
  totalQuestions: { type: Number, default: 0 },
  answeredQuestions: { type: Number, default: 0 },
  skippedQuestions: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // in seconds
  scores: {
    overall: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    technical: { type: Number, default: 0 },
    professionalism: { type: Number, default: 0 }
  },
  completionRate: { type: Number, default: 0 },
  avgResponseTime: { type: Number, default: 0 },
  feedback: {
    strengths: [String],
    improvements: [String],
    recommendations: [String]
  },
  qualifyingMark: { type: Number, default: 60 },
  passed: { type: Boolean, default: false },
  status: { type: String, enum: ['completed', 'incomplete'], default: 'completed' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
