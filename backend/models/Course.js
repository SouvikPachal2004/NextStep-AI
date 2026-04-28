const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required']
  },
  category: {
    type: String,
    required: true,
    enum: ['Programming', 'Data Science', 'Web Development', 'Machine Learning', 'AI', 'Other']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  thumbnail: {
    type: String,
    default: null
  },
  duration: {
    hours: { type: Number, default: 0 },
    minutes: { type: Number, default: 0 }
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modules: [{
    title: String,
    description: String,
    order: Number,
    lessons: [{
      title: String,
      type: { type: String, enum: ['video', 'article', 'quiz'], default: 'video' },
      content: String,
      videoUrl: String,
      duration: Number,
      order: Number,
      isCompleted: { type: Boolean, default: false }
    }]
  }],
  skills: [{
    type: String
  }],
  prerequisites: [{
    type: String
  }],
  totalVideos: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update total videos count
courseSchema.methods.updateVideoCount = function() {
  let count = 0;
  this.modules.forEach(module => {
    count += module.lessons.filter(l => l.type === 'video').length;
  });
  this.totalVideos = count;
  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);
