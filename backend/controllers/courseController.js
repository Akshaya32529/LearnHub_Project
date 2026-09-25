import Course from '../models/Course.js';
import Category from '../models/Category.js';
import CourseModule from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import CourseProgress from '../models/CourseProgress.js';
import Certificate from '../models/Certificate.js';
import ReviewHistory from '../models/ReviewHistory.js';
import { Quiz, Question, QuizAttempt } from '../models/Quiz.js';
import Assignment, { Submission } from '../models/Assignment.js';
import { MentorFeedback } from '../models/Mentor.js';
import { isDbConnected } from '../config/db.js';
import memoryStore from '../services/memoryStore.js';
import { canViewCourse, hasCourseContentAccess, canEditCourseContent, isCourseManager } from '../utils/courseAccess.js';

const databaseUnavailable = (res) => res.status(503).json({ success: false, message: 'Course service is temporarily unavailable.' });

/**
 * @desc   Get courses
 * @route  GET /api/courses
 * @access Private/Public
 */
export const getCourses = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    if (isDbConnected()) {
      let query = {};
      if (req.query.category) query.category = req.query.category;
      if (req.query.status) query.status = req.query.status;

      if (req.user && req.user.role === 'instructor') {
        query.instructor = req.user._id;
      } else if (req.user && req.user.role !== 'admin') {
        query.status = 'PUBLISHED';
      }

      let courseQuery = Course.find(query);
      if (!isCourseManager(null, req.user) && req.user?.role !== 'instructor') courseQuery = courseQuery.select('-reviewer -reviewComment -reviewedAt -submittedAt');
      const courses = await courseQuery
        .populate('category', 'name slug')
        .populate('instructor', 'name email role avatar')
        .sort({ createdAt: -1 });

      const coursesWithCounts = await Promise.all(
        courses.map(async (c) => {
          const moduleCount = await CourseModule.countDocuments({ course: c._id });
          const lessonCount = await Lesson.countDocuments({ course: c._id });
          return {
            ...c.toObject(),
            moduleCount,
            lessonCount,
          };
        })
      );

      return res.status(200).json({
        success: true,
        count: coursesWithCounts.length,
        courses: coursesWithCounts,
      });
    } else {
      let filter = {};
      if (req.user && req.user.role === 'instructor') {
        filter.instructor = req.user._id;
      }
      if (req.query.category) {
        filter.category = req.query.category;
      }
      if (req.user && req.user.role !== 'admin' && req.user.role !== 'instructor') {
        filter.status = 'PUBLISHED';
      }

      const courses = memoryStore.getCourses(filter);
      const coursesWithCounts = courses.map((c) => {
        const moduleCount = memoryStore.modules.filter(
          (m) => m.course.toString() === c._id.toString()
        ).length;
        const lessonCount = memoryStore.lessons.filter(
          (l) => l.course.toString() === c._id.toString()
        ).length;
        return {
          ...c,
          moduleCount,
          lessonCount,
        };
      });

      return res.status(200).json({
        success: true,
        count: coursesWithCounts.length,
        courses: coursesWithCounts,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get single course by ID with hierarchical modules & lessons
 * @route  GET /api/courses/:id
 * @access Public / Private
 */
export const getCourseById = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { id } = req.params;

    if (isDbConnected()) {
      const course = await Course.findById(id)
        .populate('category', 'name slug description')
        .populate('instructor', 'name email role bio avatar');

      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      if (!canViewCourse(course, req.user)) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const modules = await CourseModule.find({ course: course._id, isActive: true })
        .sort({ orderIndex: 1 })
        .lean();

      const hasContentAccess = await hasCourseContentAccess(course, req.user);
      const modulesWithLessons = await Promise.all(
        modules.map(async (mod) => {
          const lessonQuery = { module: mod._id, isActive: true };
          if (!hasContentAccess) lessonQuery.$or = [{ isPreview: true }, { isFreePreview: true }];
          const lessons = await Lesson.find(lessonQuery)
            .sort({ orderIndex: 1 })
            .lean();
          return {
            ...mod,
            lessons,
          };
        })
      );

        const courseData = course.toObject();
        if (!isCourseManager(course, req.user)) {
          delete courseData.reviewComment;
          delete courseData.reviewedAt;
          delete courseData.reviewer;
          delete courseData.submittedAt;
        }

        return res.status(200).json({
          success: true,
          course: {
            ...courseData,
          modules: modulesWithLessons,
        },
      });
    } else {
      const course = memoryStore.getCourseById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      if (!canViewCourse(course, req.user)) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const enrolled = req.user?.role === 'student' && memoryStore.enrollments?.some((enrollment) => enrollment.student.toString() === req.user._id.toString() && enrollment.course.toString() === course._id.toString());
      const hasContentAccess = enrolled || req.user?.role === 'admin' || req.user?.role === 'reviewer' || (req.user?.role === 'instructor' && course.instructor?._id?.toString() === req.user._id.toString());
      const modules = memoryStore.getModulesByCourse(course._id);
      const modulesWithLessons = modules.map((mod) => {
        const lessons = memoryStore.getLessonsByModule(mod._id).filter((lesson) => hasContentAccess || lesson.isPreview || lesson.isFreePreview);
        return {
          ...mod,
          lessons,
        };
      });

        const courseData = { ...course };
        if (!isCourseManager(course, req.user)) {
          delete courseData.reviewComment;
          delete courseData.reviewedAt;
          delete courseData.reviewer;
          delete courseData.submittedAt;
        }

        return res.status(200).json({
          success: true,
          course: {
            ...courseData,
          modules: modulesWithLessons,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Create new course
 * @route  POST /api/courses
 * @access Private (Instructor or Admin)
 */
export const createCourse = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const {
      title,
      description,
      shortDescription,
      category,
      thumbnail,
      level,
      duration,
      requirements,
      learningOutcomes,
      tags,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course title, description, and valid category ID.',
      });
    }

    if (isDbConnected()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({ success: false, message: 'Specified category does not exist.' });
      }

      const course = await Course.create({
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDescription ? shortDescription.trim() : '',
        category,
        thumbnail: thumbnail || '',
        instructor: req.user._id,
        level: level || 'Beginner',
        duration: duration || 'Self-paced',
        status: 'DRAFT',
        requirements: Array.isArray(requirements) ? requirements : [],
        learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
        tags: Array.isArray(tags) ? tags : [],
      });

      const populatedCourse = await Course.findById(course._id)
        .populate('category', 'name slug')
        .populate('instructor', 'name email role');

      return res.status(201).json({
        success: true,
        message: 'Course created in DRAFT status',
        course: populatedCourse,
      });
    } else {
      const course = memoryStore.createCourse(
        {
          title: title.trim(),
          description: description.trim(),
          shortDescription,
          category,
          thumbnail,
          level,
          duration,
          requirements,
          learningOutcomes,
          tags,
        },
        req.user._id
      );

      return res.status(201).json({
        success: true,
        message: 'Course created in DRAFT status',
        course,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update course
 * @route  PUT /api/courses/:id
 * @access Private (Owner Instructor or Admin)
 */
export const updateCourse = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { id } = req.params;

    if (isDbConnected()) {
      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const isOwner = course.instructor.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only edit your own courses.',
        });
      }
      if (!canEditCourseContent(course, req.user)) {
        return res.status(409).json({ success: false, message: 'Submit a course revision after review before editing this course.' });
      }

      const updatableFields = [
        'title',
        'shortDescription',
        'description',
        'category',
        'thumbnail',
        'level',
        'duration',
        'requirements',
        'learningOutcomes',
        'tags',
        'isActive',
      ];

      updatableFields.forEach((field) => {
        if (req.body[field] !== undefined) course[field] = req.body[field];
      });

      await course.save();

      const updated = await Course.findById(course._id)
        .populate('category', 'name slug')
        .populate('instructor', 'name email role');

      return res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        course: updated,
      });
    } else {
      const course = memoryStore.getCourseById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const isOwner = course.instructor?._id?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only edit your own courses.',
        });
      }
      if (!canEditCourseContent(course, req.user)) {
        return res.status(409).json({ success: false, message: 'Submit a course revision after review before editing this course.' });
      }

      const updated = memoryStore.updateCourse(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        course: updated,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete course
 * @route  DELETE /api/courses/:id
 * @access Private (Owner Instructor or Admin)
 */
export const deleteCourse = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { id } = req.params;

    if (isDbConnected()) {
      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const isOwner = course.instructor.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only delete your own courses.',
        });
      }

      if (!isAdmin && !['DRAFT', 'REJECTED', 'CHANGES_REQUESTED'].includes(course.status)) {
        return res.status(409).json({ success: false, message: 'Only draft or returned courses can be deleted. Archive published courses through the review workflow.' });
      }

      const quizzes = await Quiz.find({ course: course._id }).select('_id');
      const assignments = await Assignment.find({ course: course._id }).select('_id');
      const quizIds = quizzes.map((quiz) => quiz._id);
      const assignmentIds = assignments.map((assignment) => assignment._id);
      await Promise.all([
        Question.deleteMany({ quiz: { $in: quizIds } }),
        QuizAttempt.deleteMany({ quiz: { $in: quizIds } }),
        Submission.deleteMany({ assignment: { $in: assignmentIds } }),
        Quiz.deleteMany({ course: course._id }),
        Assignment.deleteMany({ course: course._id }),
        Enrollment.deleteMany({ course: course._id }),
        CourseProgress.deleteMany({ course: course._id }),
        Certificate.deleteMany({ course: course._id }),
        ReviewHistory.deleteMany({ course: course._id }),
        MentorFeedback.deleteMany({ course: course._id }),
        Lesson.deleteMany({ course: course._id }),
        CourseModule.deleteMany({ course: course._id }),
      ]);
      await Course.findByIdAndDelete(course._id);

      return res.status(200).json({
        success: true,
        message: 'Course and its curriculum modules/lessons deleted successfully',
      });
    } else {
      const course = memoryStore.getCourseById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const isOwner = course.instructor?._id?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only delete your own courses.',
        });
      }

      memoryStore.deleteCourse(id);
      return res.status(200).json({
        success: true,
        message: 'Course and its curriculum modules/lessons deleted successfully',
      });
    }
  } catch (error) {
    next(error);
  }
};
