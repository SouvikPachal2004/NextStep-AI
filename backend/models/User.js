const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  skills: [{
    type: String
  }],
  resume: {
    filename: String,
    path: String,
    uploadedAt: Date,
    atsScore: Number,
    extractedSkills: [String],
    analysis: Object
  },
  learningStreak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActivity: Date
  },
  preferences: {
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update learning streak
userSchema.methods.updateStreak = function() {
  const now = new Date();
  const lastActivity = this.learningStreak.lastActivity;
  
  if (!lastActivity) {
    this.learningStreak.current = 1;
    this.learningStreak.lastActivity = now;
  } else {
    const daysDiff = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      this.learningStreak.current += 1;
      if (this.learningStreak.current > this.learningStreak.longest) {
        this.learningStreak.longest = this.learningStreak.current;
      }
    } else if (daysDiff > 1) {
      this.learningStreak.current = 1;
    }
    
    this.learningStreak.lastActivity = now;
  }
  
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
