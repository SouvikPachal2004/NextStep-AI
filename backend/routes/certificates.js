const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const CertificateRequest = require('../models/CertificateRequest');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');

// ─── CERTIFICATE REQUESTS ────────────────────────────────────────────────────

// POST /api/certificates/request  — user submits request after 100% progress
router.post('/request', protect, async (req, res) => {
  try {
    const { courseId } = req.body;

    const enrollment = await Enrollment.findOne({
      user: req.user.id,
      course: courseId,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.status(400).json({ success: false, message: 'You must be enrolled in this course first' });
    }
    if (enrollment.progress < 100) {
      return res.status(400).json({ success: false, message: `Course not complete yet (${enrollment.progress}%). Reach 100% to request a certificate.` });
    }

    // Already has a certificate
    const existingCert = await Certificate.findOne({ user: req.user.id, course: courseId });
    if (existingCert) {
      return res.status(400).json({ success: false, message: 'Certificate already issued for this course' });
    }

    // Check existing request
    let request = await CertificateRequest.findOne({ user: req.user.id, course: courseId });
    if (request) {
      if (request.status === 'pending')   return res.status(400).json({ success: false, message: 'Request already pending admin review' });
      if (request.status === 'approved')  return res.status(400).json({ success: false, message: 'Certificate already issued' });
      // rejected → allow re-request
      request.status = 'pending';
      request.requestedAt = new Date();
      request.reviewedAt = undefined;
      request.note = '';
      await request.save();
    } else {
      request = await CertificateRequest.create({
        user: req.user.id,
        course: courseId,
        enrollment: enrollment._id
      });
    }

    const populated = await CertificateRequest.findById(request._id)
      .populate('user', 'name email')
      .populate('course', 'title category');

    // Notify all admins about the certificate request
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' }, '_id');
    if (admins.length) {
      await Notification.insertMany(admins.map(a => ({
        user: a._id,
        type: 'certificate_request',
        title: '🎓 Certificate Request',
        message: `${populated.user?.name} has requested a certificate for "${populated.course?.title}". Review it in the Certificates section.`,
        data: {
          requestId: request._id.toString(),
          courseId: populated.course?._id?.toString(),
          courseTitle: populated.course?.title,
          userName: populated.user?.name
        }
      })));
    }

    res.status(201).json({ success: true, data: populated, message: 'Certificate request submitted! Awaiting admin approval.' });
  } catch (err) {
    console.error('Cert request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/certificates/requests  — admin: all (filter ?status=pending), user: own
router.get('/requests', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? (req.query.status ? { status: req.query.status } : {})
      : { user: req.user.id };

    const requests = await CertificateRequest.find(query)
      .populate('user', 'name email')
      .populate('course', 'title category')
      .populate('certificate')
      .sort({ requestedAt: -1 });

    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/certificates/requests/:id/approve  — admin approves → issues cert + notifies user
router.put('/requests/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const request = await CertificateRequest.findById(req.params.id)
      .populate('user', 'name email')
      .populate('course', 'title category');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed' });

    // Issue certificate
    let cert = await Certificate.findOne({ user: request.user._id, course: request.course._id });
    if (!cert) {
      const now = new Date();
      cert = await Certificate.create({
        user: request.user._id,
        course: request.course._id,
        issuedAt: now,
        completionDate: now,
        certificateId: 'CERT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
      });
    }

    // Update request
    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user.id;
    request.certificate = cert._id;
    await request.save();

    // Mark enrollment as completed + certificateIssued
    await Enrollment.findByIdAndUpdate(request.enrollment, {
      certificateIssued: true,
      certificateId: cert._id,
      status: 'completed'
    });

    // Notify user
    await Notification.create({
      user: request.user._id,
      type: 'certificate_approved',
      title: '🎓 Certificate Approved!',
      message: `Your certificate for "${request.course.title}" has been approved. You can now download it from your dashboard.`,
      data: { certificateId: cert._id.toString(), courseId: request.course._id.toString(), courseTitle: request.course.title }
    });

    const populated = await Certificate.findById(cert._id)
      .populate('course', 'title category')
      .populate('user', 'name email');

    res.json({ success: true, data: populated, message: 'Certificate issued and student notified!' });
  } catch (err) {
    console.error('Approve request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/certificates/requests/:id/reject  — admin rejects + notifies user
router.put('/requests/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const request = await CertificateRequest.findById(req.params.id)
      .populate('user', 'name email')
      .populate('course', 'title category');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed' });

    request.status = 'rejected';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user.id;
    request.note = req.body.note || '';
    await request.save();

    await Notification.create({
      user: request.user._id,
      type: 'certificate_rejected',
      title: 'Certificate Request Not Approved',
      message: `Your certificate request for "${request.course.title}" was not approved.${request.note ? ' Reason: ' + request.note : ''} You may re-submit after completing all requirements.`,
      data: { courseId: request.course._id.toString(), courseTitle: request.course.title }
    });

    res.json({ success: true, message: 'Request rejected and student notified' });
  } catch (err) {
    console.error('Reject request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ISSUED CERTIFICATES ─────────────────────────────────────────────────────

// GET /api/certificates  — admin: all, user: own
router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role !== 'admin' ? { user: req.user.id } : {};
    const certificates = await Certificate.find(query)
      .populate('course', 'title category')
      .populate('user', 'name email')
      .sort({ issuedAt: -1 });
    res.json({ success: true, count: certificates.length, data: certificates });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/certificates/:id  — public (for verification link)
router.get('/:id', async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate('course', 'title category')
      .populate('user', 'name');
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    res.json({ success: true, data: cert });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/certificates  — admin manually issues
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    const existing = await Certificate.findOne({ user: userId, course: courseId });
    if (existing) return res.status(400).json({ success: false, message: 'Certificate already issued' });

    const now = new Date();
    const cert = await Certificate.create({
      user: userId,
      course: courseId,
      issuedAt: now,
      completionDate: now,
      certificateId: 'CERT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
    });

    // Notify user
    const Course = require('../models/Course');
    const course = await Course.findById(courseId).select('title');
    await Notification.create({
      user: userId,
      type: 'certificate_approved',
      title: '🎓 Certificate Issued!',
      message: `Your certificate for "${course?.title || 'the course'}" has been issued. Download it from your dashboard.`,
      data: { certificateId: cert._id.toString(), courseId: courseId.toString() }
    });

    const populated = await Certificate.findById(cert._id)
      .populate('course', 'title category')
      .populate('user', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Manual issue error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/certificates/:id  — admin revokes
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndDelete(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    res.json({ success: true, message: 'Certificate revoked' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
