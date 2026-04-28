const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedLessons: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    lessonId: mongoose.Schema.Types.ObjectId,
    completedAt: Date
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'dropped', 'rejected'],
    default: 'pending'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate enrollments
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// Calculate progress
enrollmentSchema.methods.calculateProgress = async function() {
  const course = await mongoose.model('Course').findById(this.course);
  if (!course) return 0;
  
  let totalLessons = 0;
  course.modules.forEach(module => {
    totalLessons += module.lessons.length;
  });
  
  if (totalLessons === 0) return 0;
  
  const progress = Math.round((this.completedLessons.length / totalLessons) * 100);
  this.progress = progress;
  
  if (progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
