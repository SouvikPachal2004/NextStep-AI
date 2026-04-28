const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper — notify all admins
async function notifyAdmins(type, title, message, data = {}) {
  try {
    const admins = await User.find({ role: 'admin' }, '_id');
    if (!admins.length) return;
    await Notification.insertMany(admins.map(a => ({ user: a._id, type, title, message, data })));
  } catch (err) {
    console.error('notifyAdmins error:', err);
  }
}

// ─── GET ALL JOBS ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, type, location, search, all } = req.query;
    let query = {};
    if (!all) query.isActive = true;
    if (category) query.category = category;
    if (type) query.employmentType = type;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { 'company.name': { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    const jobs = await Job.find(query).populate('postedBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET USER'S OWN APPLICATIONS (must be before /:id) ───────────────────────
router.get('/my/applications', protect, async (req, res) => {
  try {
    const jobs = await Job.find({ 'applications.user': req.user._id })
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    const applications = jobs.map(job => {
      const userApp = job.applications.find(
        app => app.user.toString() === req.user._id.toString()
      );
      return {
        _id: userApp._id,
        job: {
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          workType: job.workType,
          employmentType: job.employmentType,
          category: job.category,
          salary: job.salary
        },
        status: userApp.status,
        appliedAt: userApp.appliedAt,
        matchScore: userApp.matchScore,
        adminNote: userApp.adminNote || '',
        // Only reveal the application link if the admin has accepted this user
        applicationLink: userApp.status === 'accepted' ? (job.applicationLink || '') : ''
      };
    });

    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET SINGLE JOB ───────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    job.viewCount += 1;
    await job.save();
    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── CREATE JOB (admin) ───────────────────────────────────────────────────────
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// ─── UPDATE JOB (admin) ───────────────────────────────────────────────────────
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── DELETE JOB (admin) ───────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── APPLY TO JOB (user) ──────────────────────────────────────────────────────
router.post('/:id/apply', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (!job.isActive) return res.status(400).json({ success: false, message: 'This job is no longer active' });

    const already = job.applications.find(a => a.user.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ success: false, message: 'You have already applied to this job' });

    job.applications.push({ user: req.user._id, status: 'pending', appliedAt: new Date() });
    await job.save();

    // Notify all admins about the new job application
    await notifyAdmins(
      'job_application',
      '💼 New Job Application',
      `${req.user.name} has applied for "${job.title}" at ${job.company?.name || 'Company'}. Review it in Job Posts.`,
      {
        jobId: job._id.toString(),
        jobTitle: job.title,
        companyName: job.company?.name,
        userName: req.user.name,
        userEmail: req.user.email
      }
    );

    res.json({ success: true, message: 'Application submitted successfully', data: job });
  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// ─── GET ALL APPLICATIONS FOR A JOB (admin) ───────────────────────────────────
router.get('/:id/applications', protect, authorize('admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('applications.user', 'name email avatar');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, count: job.applications.length, data: job.applications, job: { title: job.title, applicationLink: job.applicationLink } });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── UPDATE APPLICATION STATUS (admin) ────────────────────────────────────────
router.put('/:jobId/applications/:applicationId', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const application = job.applications.id(req.params.applicationId);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    const prevStatus = application.status;
    application.status = status;
    if (adminNote !== undefined) application.adminNote = adminNote;
    await job.save();

    // ── Notify the user about their application status change ─────────────────
    const notifMap = {
      accepted: {
        type: 'job_accepted',
        title: '🎉 Job Application Accepted!',
        message: `Congratulations! Your application for "${job.title}" at ${job.company?.name || 'the company'} has been accepted. Check your Applied Jobs for the next steps.`
      },
      rejected: {
        type: 'job_rejected',
        title: '❌ Job Application Update',
        message: `Your application for "${job.title}" at ${job.company?.name || 'the company'} was not selected this time. Keep applying — the right opportunity is out there!`
      },
      shortlisted: {
        type: 'job_shortlisted',
        title: '⭐ You\'ve Been Shortlisted!',
        message: `Great news! You've been shortlisted for "${job.title}" at ${job.company?.name || 'the company'}. The team will be in touch soon.`
      },
      reviewed: {
        type: 'job_reviewed',
        title: '👁 Application Under Review',
        message: `Your application for "${job.title}" at ${job.company?.name || 'the company'} is being reviewed. We'll update you soon.`
      }
    };

    if (notifMap[status] && status !== prevStatus) {
      await Notification.create({
        user: application.user,
        type: notifMap[status].type,
        title: notifMap[status].title,
        message: notifMap[status].message,
        data: {
          jobId: job._id.toString(),
          jobTitle: job.title,
          companyName: job.company?.name,
          status,
          applicationLink: status === 'accepted' ? (job.applicationLink || '') : ''
        }
      });
    }

    res.json({ success: true, message: 'Application status updated', data: application });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

module.exports = router;
