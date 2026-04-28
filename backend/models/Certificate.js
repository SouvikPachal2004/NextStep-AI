const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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
  certificateId: {
    type: String,
    unique: true,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  skills: [{
    type: String
  }],
  verificationUrl: {
    type: String
  },
  pdfPath: {
    type: String
  }
}, {
  timestamps: true
});

// Generate unique certificate ID
certificateSchema.pre('save', function(next) {
  if (!this.certificateId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.certificateId = `CERT-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
