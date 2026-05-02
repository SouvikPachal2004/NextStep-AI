const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      // ── Admin receives ──────────────────────────────
      'new_enrollment',        // user requests course enrollment
      'course_completed',      // user marks course as complete
      'certificate_request',   // user requests certificate
      'job_application',       // user applies to a job
      'assessment_completed',  // user completes an assessment
      'interview_completed',   // user completes an interview
      // ── User receives ──────────────────────────────
      'enrollment_approved',
      'enrollment_rejected',
      'certificate_approved',
      'certificate_rejected',
      'job_accepted',
      'job_rejected',
      'job_shortlisted',
      'job_reviewed',
      'interview_result',      // user receives interview result
      'interview_warning',     // user scored below qualifying mark
      'admin_feedback',        // user receives admin feedback/remarks on interview
      // ── Generic ────────────────────────────────────
      'general'
    ],
    required: true
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  data:    { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead:  { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
