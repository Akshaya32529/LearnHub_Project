import Course from '../models/Course.js';
import ReviewHistory from '../models/ReviewHistory.js';
import { isDbConnected } from '../config/db.js';
import Notification from '../models/Notification.js';

const allowedTransitions = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED', 'CHANGES_REQUESTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
  APPROVED: ['PUBLISHED'],
  REJECTED: ['SUBMITTED'],
  CHANGES_REQUESTED: ['SUBMITTED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: [],
};

export const getReviewQueue = async (req, res, next) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Course review is temporarily unavailable.' });

    const [courses, publishedCourses] = await Promise.all([
      Course.find({ status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] } })
        .populate('category', 'name')
        .populate('instructor', 'name email')
        .sort({ updatedAt: -1 }),
      Course.find({ status: 'PUBLISHED' })
      .populate('category', 'name')
      .populate('instructor', 'name email')
      .sort({ updatedAt: -1 }).limit(100),
    ]);

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses,
      publishedCourses,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourseReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    const validActions = ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'PUBLISHED', 'ARCHIVED'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review action.',
      });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    if (req.user.role !== 'reviewer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only reviewers or admins can review courses.',
      });
    }

    const currentStatus = course.status;
    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from ${currentStatus} to ${action}.`,
      });
    }

    course.status = action;
    course.reviewer = req.user._id;
    course.reviewComment = comment || '';
    course.reviewedAt = new Date();

    if (action === 'PUBLISHED') {
      course.publishedAt = new Date();
    }

    await course.save();

    await ReviewHistory.create({
      course: course._id,
      reviewer: req.user.role === 'reviewer' || req.user.role === 'admin' ? req.user._id : null,
      actor: req.user._id,
      action,
      comment: comment || '',
    });

    const notificationTypes = {
      APPROVED: 'COURSE_APPROVED',
      REJECTED: 'COURSE_REJECTED',
      CHANGES_REQUESTED: 'CHANGES_REQUESTED',
      PUBLISHED: 'COURSE_PUBLISHED',
    };
    if (notificationTypes[action]) {
      await Notification.create({
        recipient: course.instructor,
        type: notificationTypes[action],
        title: action === 'PUBLISHED' ? 'Course published' : `Course ${action.toLowerCase().replace('_', ' ')}`,
        message: comment || `${course.title} was ${action.toLowerCase().replace('_', ' ')}.`,
        link: `/instructor/courses/${course._id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Course moved to ${action} successfully.`,
      course,
    });
  } catch (error) {
    next(error);
  }
};

export const submitCourseForReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    const isOwner = course.instructor.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only submit your own courses for review.',
      });
    }

    if (course.status !== 'DRAFT' && course.status !== 'CHANGES_REQUESTED' && course.status !== 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'This course cannot be submitted in its current state.',
      });
    }

    course.status = 'SUBMITTED';
    course.submittedAt = new Date();
    course.reviewComment = '';
    await course.save();

    await ReviewHistory.create({
      course: course._id,
      reviewer: null,
      actor: req.user._id,
      action: 'SUBMITTED',
      comment: 'Course submitted for review',
    });

    return res.status(200).json({
      success: true,
      message: 'Course submitted for review successfully.',
      course,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseReviewHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    const isOwner = course.instructor.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin' && req.user.role !== 'reviewer') {
      return res.status(403).json({ success: false, message: 'You cannot view this course review history.' });
    }
    const history = await ReviewHistory.find({ course: id }).populate('actor', 'name email role').populate('reviewer', 'name email role').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    next(error);
  }
};
