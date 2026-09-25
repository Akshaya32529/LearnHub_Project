import Lesson from '../models/Lesson.js';
import CourseModule from '../models/Module.js';
import Course from '../models/Course.js';
import { isDbConnected } from '../config/db.js';
import memoryStore from '../services/memoryStore.js';
import { canViewCourse, canEditCourseContent, hasCourseContentAccess, isPreviewLesson } from '../utils/courseAccess.js';

const databaseUnavailable = (res) => res.status(503).json({ success: false, message: 'Course lessons are temporarily unavailable.' });

/**
 * @desc   Get lessons for a module
 * @route  GET /api/modules/:moduleId/lessons
 * @access Public / Private
 */
export const getModuleLessons = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { moduleId } = req.params;

    if (isDbConnected()) {
      const module = await CourseModule.findById(moduleId);
      if (!module) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }

      const course = await Course.findById(module.course);
      if (!course || !canViewCourse(course, req.user)) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }

      const hasContentAccess = await hasCourseContentAccess(course, req.user);
      const lessonQuery = { module: moduleId, isActive: true };
      if (!hasContentAccess) lessonQuery.$or = [{ isPreview: true }, { isFreePreview: true }];
      const lessons = await Lesson.find(lessonQuery).sort({ orderIndex: 1 });
      return res.status(200).json({ success: true, count: lessons.length, lessons });
    } else {
      const module = memoryStore.getModuleById(moduleId);
      if (!module) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }
      const course = memoryStore.getCourseById(module.course);
      if (!course || !canViewCourse(course, req.user)) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }

      const hasContentAccess = await hasCourseContentAccess(course, req.user);
      const lessons = memoryStore.getLessonsByModule(moduleId).filter((lesson) => hasContentAccess || isPreviewLesson(lesson));
      return res.status(200).json({ success: true, count: lessons.length, lessons });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get single lesson
 * @route  GET /api/lessons/:id
 * @access Public / Private
 */
export const getLessonById = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { id } = req.params;

    if (isDbConnected()) {
      const lesson = await Lesson.findById(id)
        .populate('module', 'title orderIndex')
        .populate('course', 'title instructor level status');

      if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }
      if (!lesson.course || !canViewCourse(lesson.course, req.user)) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }
      if (!await hasCourseContentAccess(lesson.course, req.user) && !isPreviewLesson(lesson)) {
        return res.status(403).json({ success: false, message: 'Enroll in this course to view the lesson.' });
      }

      return res.status(200).json({ success: true, lesson });
    } else {
      const lesson = memoryStore.getLessonById(id);
      if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }
      const course = memoryStore.getCourseById(lesson.course);
      if (!course || !canViewCourse(course, req.user)) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }
      if (!await hasCourseContentAccess(course, req.user) && !isPreviewLesson(lesson)) {
        return res.status(403).json({ success: false, message: 'Enroll in this course to view the lesson.' });
      }

      return res.status(200).json({ success: true, lesson });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Create lesson inside a module
 * @route  POST /api/modules/:moduleId/lessons
 * @access Private (Instructor/Admin owner)
 */
export const createLesson = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { moduleId } = req.params;
    const {
      title,
      description,
      contentType,
      content,
      videoUrl,
      duration,
      orderIndex,
      isFreePreview,
      type,
      resourceUrl,
      order,
      isPreview,
    } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Lesson title is required.' });
    }

    if (isDbConnected()) {
      const module = await CourseModule.findById(moduleId);
      if (!module) {
        return res.status(404).json({ success: false, message: 'Parent module not found' });
      }

      const course = await Course.findById(module.course);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course associated with module not found' });
      }

      const isOwner = course.instructor.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only add lessons to your own courses.',
        });
      }

      let calculatedOrder = orderIndex;
      if (calculatedOrder === undefined) {
        const highestLesson = await Lesson.findOne({ module: moduleId }).sort({ orderIndex: -1 });
        calculatedOrder = highestLesson ? highestLesson.orderIndex + 1 : 1;
      }

      const legacyType = String(contentType || '').toLowerCase();
      const normalizedType = type || ({ video: 'VIDEO', document: 'RESOURCE', article: 'TEXT' }[legacyType]) || 'TEXT';
      const normalizedOrder = orderIndex ?? order ?? calculatedOrder;
      const preview = isPreview ?? isFreePreview ?? false;
      const lesson = await Lesson.create({
        module: moduleId,
        course: course._id,
        title: title.trim(),
        description: description ? description.trim() : '',
        contentType: contentType || normalizedType,
        type: normalizedType,
        content: content || '',
        videoUrl: videoUrl ? videoUrl.trim() : '',
        resourceUrl: resourceUrl ? resourceUrl.trim() : '',
        duration: duration ? Number(duration) : 10,
        orderIndex: normalizedOrder,
        order: normalizedOrder,
        isFreePreview: Boolean(preview),
        isPreview: Boolean(preview),
      });

      return res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        lesson,
      });
    } else {
      const module = memoryStore.getModuleById(moduleId);
      if (!module) {
        return res.status(404).json({ success: false, message: 'Parent module not found' });
      }

      const course = memoryStore.getCourseById(module.course);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course associated with module not found' });
      }

      const isOwner = course.instructor?._id?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only add lessons to your own courses.',
        });
      }

      const lesson = memoryStore.createLesson(moduleId, course._id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        lesson,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update lesson
 * @route  PUT /api/lessons/:id
 * @access Private (Instructor/Admin owner)
 */
export const updateLesson = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { id } = req.params;

    if (isDbConnected()) {
      const lesson = await Lesson.findById(id);
      if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }

      const course = await Course.findById(lesson.course);
      const isOwner = course && course.instructor.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only edit lessons of your own course.',
        });
      }

      const updatableFields = [
        'title',
        'description',
        'contentType',
        'type',
        'content',
        'videoUrl',
        'resourceUrl',
        'duration',
        'orderIndex',
        'order',
        'isFreePreview',
        'isPreview',
        'isActive',
      ];

      updatableFields.forEach((field) => {
        if (req.body[field] !== undefined) lesson[field] = req.body[field];
      });
      const requestedType = req.body.type || req.body.contentType;
      if (requestedType) {
        const lower = String(requestedType).toLowerCase();
        lesson.type = ({ video: 'VIDEO', document: 'RESOURCE', article: 'TEXT' }[lower]) || String(requestedType).toUpperCase();
        lesson.contentType = req.body.contentType || lesson.type;
      }
      if (req.body.order !== undefined || req.body.orderIndex !== undefined) {
        lesson.order = req.body.order ?? req.body.orderIndex;
        lesson.orderIndex = lesson.order;
      }
      if (req.body.isPreview !== undefined || req.body.isFreePreview !== undefined) {
        lesson.isPreview = Boolean(req.body.isPreview ?? req.body.isFreePreview);
        lesson.isFreePreview = lesson.isPreview;
      }

      await lesson.save();

      return res.status(200).json({
        success: true,
        message: 'Lesson updated successfully',
        lesson,
      });
    } else {
      const lesson = memoryStore.getLessonById(id);
      if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }

      const course = memoryStore.getCourseById(lesson.course);
      const isOwner = course && course.instructor?._id?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only edit lessons of your own course.',
        });
      }

      const updated = memoryStore.updateLesson(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Lesson updated successfully',
        lesson: updated,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete lesson
 * @route  DELETE /api/lessons/:id
 * @access Private (Instructor/Admin owner)
 */
export const deleteLesson = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { id } = req.params;

    if (isDbConnected()) {
      const lesson = await Lesson.findById(id);
      if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }

      const course = await Course.findById(lesson.course);
      const isOwner = course && course.instructor.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only delete lessons of your own course.',
        });
      }

      await Lesson.findByIdAndDelete(lesson._id);

      return res.status(200).json({
        success: true,
        message: 'Lesson deleted successfully',
      });
    } else {
      const lesson = memoryStore.getLessonById(id);
      if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }

      const course = memoryStore.getCourseById(lesson.course);
      const isOwner = course && course.instructor?._id?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only delete lessons of your own course.',
        });
      }

      memoryStore.deleteLesson(id);
      return res.status(200).json({
        success: true,
        message: 'Lesson deleted successfully',
      });
    }
  } catch (error) {
    next(error);
  }
};
