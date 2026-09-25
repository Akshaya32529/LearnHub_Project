import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import { isDbConnected } from '../config/db.js';
import Notification from '../models/Notification.js';
import CourseProgress from '../models/CourseProgress.js';
import mongoose from 'mongoose';

export const enrollInCourse = async (req, res, next) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Enrollment service is temporarily unavailable.' });
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (course.status !== 'PUBLISHED') {
      return res.status(400).json({ success: false, message: 'Only published courses are enrollable.' });
    }

    const existing = await Enrollment.findOne({ student: req.user._id, course: id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You are already enrolled in this course.' });
    }

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: id,
      status: 'ACTIVE',
    });
    await CourseProgress.findOneAndUpdate(
      { student: req.user._id, course: course._id },
      { $setOnInsert: { status: 'IN_PROGRESS' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Notification.create({
      recipient: course.instructor,
      type: 'ENROLLMENT',
      title: 'New course enrollment',
      message: `${req.user.name} enrolled in ${course.title}.`,
      link: `/instructor/courses/${course._id}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Enrollment successful.',
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course', 'title shortDescription category level duration status thumbnail instructor')
      .sort({ enrolledAt: -1 });

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments,
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentById = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('course', 'title shortDescription');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found.' });
    }

    if (enrollment.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this enrollment.' });
    }

    return res.status(200).json({ success: true, enrollment });
  } catch (error) {
    next(error);
  }
};

export const getPublicCourseCatalog = async (req, res, next) => {
  try {
    if (!isDbConnected()) return res.status(503).json({ success: false, message: 'Course catalog is temporarily unavailable.' });
    const { category, level, search, page = 1, limit = 10 } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
      return res.status(400).json({ success: false, message: 'Page and limit must be valid positive integers; limit cannot exceed 50.' });
    }
    if (search && (typeof search !== 'string' || search.length > 100)) {
      return res.status(400).json({ success: false, message: 'Search text must be 100 characters or fewer.' });
    }

    const query = { status: 'PUBLISHED' };
    if (category) {
      if (typeof category !== 'string' || !mongoose.isValidObjectId(category)) return res.status(400).json({ success: false, message: 'Category filter is invalid.' });
      query.category = category;
    }
    if (level) {
      const levels = { BEGINNER: ['BEGINNER', 'Beginner'], INTERMEDIATE: ['INTERMEDIATE', 'Intermediate'], ADVANCED: ['ADVANCED', 'Advanced'] };
      const normalizedLevel = typeof level === 'string' ? level.toUpperCase() : '';
      if (!levels[normalizedLevel]) return res.status(400).json({ success: false, message: 'Course level filter is invalid.' });
      query.level = { $in: levels[normalizedLevel] };
    }
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(escapedSearch, 'i')] } },
      ];
    }

    const skip = (pageNumber - 1) * pageSize;
    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .select('-reviewer -reviewComment -reviewedAt -submittedAt')
      .populate('category', 'name')
      .populate('instructor', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
      courses,
    });
  } catch (error) {
    next(error);
  }
};
