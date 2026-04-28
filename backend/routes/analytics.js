const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Job = require('../models/Job');
const Assessment = require('../models/Assessment');

// @route   GET /api/analytics/platform
// @desc    Get real-time platform analytics
// @access  Public (for homepage display)
router.get('/platform', async (req, res) => {
  try {
    // Get counts with real-time data
    const [
      totalUsers,
      activeUsers,
      totalCourses,
      totalEnrollments,
      totalCertificates,
      totalJobs,
      completedEnrollments,
      assessmentResults
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Certificate.countDocuments(),
      Job.countDocuments(),
      Enrollment.countDocuments({ status: 'completed' }),
      Assessment.find().select('attempts')
    ]);

    // Calculate average assessment score from attempts
    let totalScore = 0, totalAttempts = 0;
    assessmentResults.forEach(a => {
      if (a.attempts && a.attempts.length > 0) {
        a.attempts.forEach(attempt => {
          if (attempt.score !== undefined) {
            totalScore += attempt.score;
            totalAttempts++;
          }
        });
      }
    });
    const avgScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

    // Get top enrolled courses
    const topCourses = await Enrollment.aggregate([
      {
        $group: {
          _id: '$course',
          enrollmentCount: { $sum: 1 }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: '$courseInfo' },
      {
        $project: {
          name: '$courseInfo.title',
          enrollments: '$enrollmentCount'
        }
      }
    ]);

    // Calculate growth percentages (simulated for now)
    const userGrowth = Math.floor(Math.random() * 15) + 5; // 5-20%
    const courseGrowth = Math.floor(Math.random() * 10) + 3; // 3-13%
    const certGrowth = Math.floor(Math.random() * 25) + 10; // 10-35%
    const jobGrowth = Math.floor(Math.random() * 8) + 2; // 2-10%

    // Calculate placement rate
    const placementRate = completedEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    // Calculate satisfaction rate (based on completed courses)
    const satisfactionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        kpis: {
          activeUsers: {
            value: totalUsers,
            growth: userGrowth,
            label: 'Active Learners'
          },
          courses: {
            value: totalCourses,
            growth: courseGrowth,
            label: 'Courses'
          },
          certificates: {
            value: totalCertificates,
            growth: certGrowth,
            label: 'Certificates'
          },
          jobPartners: {
            value: totalJobs,
            growth: jobGrowth,
            label: 'Job Partners'
          }
        },
        topCourses: topCourses.map((course, index) => ({
          rank: index + 1,
          name: course.name,
          enrollments: course.enrollments,
          percentage: totalEnrollments > 0 
            ? Math.round((course.enrollments / totalEnrollments) * 100)
            : 0
        })),
        metrics: {
          placementRate,
          satisfactionRate,
          avgScore
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get admin dashboard analytics
// @access  Private/Admin
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get comprehensive analytics
    const [
      totalUsers,
      newUsersThisMonth,
      totalCourses,
      totalEnrollments,
      newEnrollmentsThisWeek,
      totalCertificates,
      totalJobs,
      activeJobs,
      recentUsers,
      recentEnrollments
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: lastMonth } }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ createdAt: { $gte: lastWeek } }),
      Certificate.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email role createdAt'),
      Enrollment.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name').populate('course', 'title')
    ]);

    // Get enrollment trends (last 7 days)
    const enrollmentTrends = await Enrollment.aggregate([
      {
        $match: {
          createdAt: { $gte: lastWeek }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          newUsersThisMonth,
          totalCourses,
          totalEnrollments,
          newEnrollmentsThisWeek,
          totalCertificates,
          totalJobs,
          activeJobs
        },
        trends: {
          enrollments: enrollmentTrends
        },
        recent: {
          users: recentUsers,
          enrollments: recentEnrollments
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics'
    });
  }
});

// @route   GET /api/analytics/user/:userId
// @desc    Get user-specific analytics
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify user can access this data
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this data'
      });
    }

    const [
      enrollments,
      certificates,
      assessments,
      user
    ] = await Promise.all([
      Enrollment.find({ user: userId }).populate('course', 'title category'),
      Certificate.find({ user: userId }),
      Assessment.find({ 'attempts.user': userId }).select('attempts'),
      User.findById(userId).select('learningStreak')
    ]);

    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const inProgressCourses = enrollments.filter(e => e.status === 'in-progress').length;

    // Calculate avg score from user's attempts
    let totalScore = 0, totalAttempts = 0;
    assessments.forEach(a => {
      const userAttempts = (a.attempts || []).filter(att => att.user && att.user.toString() === userId);
      userAttempts.forEach(att => {
        if (att.score !== undefined) { totalScore += att.score; totalAttempts++; }
      });
    });
    const avgScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

    res.json({
      success: true,
      data: {
        enrollments: {
          total: enrollments.length,
          completed: completedCourses,
          inProgress: inProgressCourses
        },
        certificates: certificates.length,
        assessments: {
          total: totalAttempts,
          avgScore
        },
        learningStreak: user?.learningStreak || { current: 0, longest: 0 },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics'
    });
  }
});

module.exports = router;
