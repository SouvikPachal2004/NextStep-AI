const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assessment title is required'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  duration: {
    type: Number,
    required: true,
    default: 30
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  questions: [{
    question: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['multiple-choice', 'true-false', 'coding'],
      default: 'multiple-choice'
    },
    options: [String],
    correctAnswer: String,
    points: { type: Number, default: 1 },
    explanation: String
  }],
  totalPoints: {
    type: Number,
    default: 0
  },
  attempts: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    percentage: Number,
    answers: [{
      questionId: mongoose.Schema.Types.ObjectId,
      answer: String,
      isCorrect: Boolean,
      points: Number
    }],
    startedAt: Date,
    completedAt: Date,
    timeTaken: Number,
    passed: Boolean
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate total points
assessmentSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
  next();
});

module.exports = mongoose.model('Assessment', assessmentSchema);
