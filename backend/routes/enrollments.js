const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper — notify all admins
async function notifyAdmins(type, title, message, data = {}) {
  try {
    const admins = await User.find({ role: 'admin' }, '_id');
    if (!admins.length) return;
    const notifications = admins.map(admin => ({
      user: admin._id,
      type,
      title,
      message,
      data
    }));
    await Notification.insertMany(notifications);
  } catch (err) {
    console.error('notifyAdmins error:', err);
  }
}

// @route   GET /api/enrollments
// @desc    Get enrollments (admin gets all, user gets their own)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const enrollments = await Enrollment.find(query)
      .populate('course', 'title category level thumbnail')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: enrollments.length, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/enrollments
// @desc    Request enrollment in a course
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { courseId } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Check if already enrolled or requested
    const existing = await Enrollment.findOne({ user: req.user.id, course: courseId });
    if (existing) {
      if (existing.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Enrollment request already pending' });
      }
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    const enrollment = await Enrollment.create({
      user: req.user.id,
      course: courseId,
      status: 'pending',
      progress: 0
    });

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('course', 'title category level thumbnail')
      .populate('user', 'name email');

    // Notify ALL admins about the new enrollment request
    await notifyAdmins(
      'new_enrollment',
      '📚 New Enrollment Request',
      `${populatedEnrollment.user?.name} has requested enrollment in "${populatedEnrollment.course?.title}". Review it in the Enrollments section.`,
      {
        enrollmentId: enrollment._id.toString(),
        courseId: courseId,
        courseTitle: populatedEnrollment.course?.title,
        userName: populatedEnrollment.user?.name,
        userEmail: populatedEnrollment.user?.email
      }
    );

    res.status(201).json({ success: true, data: populatedEnrollment });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/enrollments/:id/approve
// @desc    Approve enrollment request (admin only)
// @access  Private/Admin
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    if (enrollment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Enrollment is not pending' });
    }

    enrollment.status = 'active';
    await enrollment.save();

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('course', 'title category level thumbnail')
      .populate('user', 'name email');

    // Notify user
    await Notification.create({
      user: enrollment.user,
      type: 'enrollment_approved',
      title: '✅ Enrollment Approved!',
      message: `Your enrollment in "${populatedEnrollment.course?.title}" has been approved. You can now start learning!`,
      data: { courseId: enrollment.course.toString(), courseTitle: populatedEnrollment.course?.title }
    });

    res.json({ success: true, data: populatedEnrollment });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/enrollments/:id/reject
// @desc    Reject enrollment request (admin only)
// @access  Private/Admin
router.put('/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    if (enrollment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Enrollment is not pending' });
    }

    enrollment.status = 'rejected';
    await enrollment.save();

    // Notify user
    const populatedForNotif = await Enrollment.findById(enrollment._id).populate('course', 'title');
    await Notification.create({
      user: enrollment.user,
      type: 'enrollment_rejected',
      title: 'Enrollment Not Approved',
      message: `Your enrollment request for "${populatedForNotif.course?.title}" was not approved. Please contact support for more information.`,
      data: { courseId: enrollment.course.toString() }
    });

    res.json({ success: true, message: 'Enrollment rejected' });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/enrollments/:id
// @desc    Update enrollment progress
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { progress, status } = req.body;
    const updateData = {};
    if (progress !== undefined) updateData.progress = progress;
    if (status) updateData.status = status;
    if (progress >= 100) updateData.status = 'completed';

    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate('course', 'title').populate('user', 'name email');

    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    // Notify admins when a user completes a course (progress hits 100)
    if (progress >= 100) {
      await notifyAdmins(
        'course_completed',
        '🏁 Course Completed',
        `${enrollment.user?.name || 'A student'} has completed "${enrollment.course?.title}". They may request a certificate.`,
        {
          enrollmentId: enrollment._id.toString(),
          courseId: enrollment.course?._id?.toString(),
          courseTitle: enrollment.course?.title,
          userName: enrollment.user?.name
        }
      );
    }

    res.json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/enrollments/:id
// @desc    Unenroll from a course
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    // Only allow user to delete their own enrollment (or admin)
    if (enrollment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await enrollment.deleteOne();
    res.json({ success: true, message: 'Unenrolled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
