import CourseModule from '../models/Module.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import { isDbConnected } from '../config/db.js';
import memoryStore from '../services/memoryStore.js';
import { canViewCourse, canEditCourseContent, hasCourseContentAccess, isPreviewLesson } from '../utils/courseAccess.js';

const databaseUnavailable = (res) => res.status(503).json({ success: false, message: 'Course curriculum is temporarily unavailable.' });

export const getModuleById = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const module = isDbConnected()
      ? await CourseModule.findById(req.params.id).lean()
      : memoryStore.getModuleById(req.params.id);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });

    const course = isDbConnected()
      ? await Course.findById(module.course)
      : memoryStore.getCourseById(module.course);
    if (!course || !canViewCourse(course, req.user)) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const hasContentAccess = await hasCourseContentAccess(course, req.user);
    const lessons = isDbConnected()
      ? await Lesson.find({ module: module._id, isActive: true, ...(hasContentAccess ? {} : { $or: [{ isPreview: true }, { isFreePreview: true }] }) }).sort({ orderIndex: 1 }).lean()
      : memoryStore.getLessonsByModule(module._id).filter((lesson) => hasContentAccess || isPreviewLesson(lesson));
    return res.status(200).json({ success: true, module: { ...module, lessons } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get modules for a course
 * @route  GET /api/courses/:courseId/modules
 * @access Public / Private
 */
export const getCourseModules = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { courseId } = req.params;

    if (isDbConnected()) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      if (!canViewCourse(course, req.user)) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const modules = await CourseModule.find({ course: courseId, isActive: true })
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
            lessonCount: lessons.length,
          };
        })
      );

      return res.status(200).json({
        success: true,
        count: modulesWithLessons.length,
        modules: modulesWithLessons,
      });
    } else {
      const course = memoryStore.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
      if (!canViewCourse(course, req.user)) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const modules = memoryStore.getModulesByCourse(courseId);
      const hasContentAccess = await hasCourseContentAccess(course, req.user);
      const modulesWithLessons = modules.map((mod) => {
        const lessons = memoryStore.getLessonsByModule(mod._id).filter((lesson) => hasContentAccess || isPreviewLesson(lesson));
        return {
          ...mod,
          lessons,
          lessonCount: lessons.length,
        };
      });

      return res.status(200).json({
        success: true,
        count: modulesWithLessons.length,
        modules: modulesWithLessons,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Create module in course
 * @route  POST /api/courses/:courseId/modules
 * @access Private (Instructor/Admin owner)
 */
export const createModule = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { courseId } = req.params;
    const { title, description } = req.body;
    const requestedOrder = req.body.orderIndex ?? req.body.order;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Module title is required.' });
    }

    if (isDbConnected()) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const isOwner = course.instructor.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only add modules to your own courses.',
        });
      }

      let calculatedOrder = requestedOrder;
      if (calculatedOrder === undefined) {
        const highestModule = await CourseModule.findOne({ course: courseId }).sort({ orderIndex: -1 });
        calculatedOrder = highestModule ? highestModule.orderIndex + 1 : 1;
      }

      const module = await CourseModule.create({
        course: courseId,
        title: title.trim(),
        description: description ? description.trim() : '',
        orderIndex: calculatedOrder,
        order: calculatedOrder,
      });

      return res.status(201).json({
        success: true,
        message: 'Module created successfully',
        module,
      });
    } else {
      const course = memoryStore.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const isOwner = course.instructor?._id?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only add modules to your own courses.',
        });
      }

      const module = memoryStore.createModule(courseId, { title, description, orderIndex: requestedOrder });
      return res.status(201).json({
        success: true,
        message: 'Module created successfully',
        module,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update module
 * @route  PUT /api/modules/:id
 * @access Private (Instructor/Admin owner)
 */
export const updateModule = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { id } = req.params;

    if (isDbConnected()) {
      const module = await CourseModule.findById(id);
      if (!module) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }

      const course = await Course.findById(module.course);
      const isOwner = course && course.instructor.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only edit modules of your own course.',
        });
      }

      const { title, description, isActive } = req.body;
      const orderIndex = req.body.orderIndex ?? req.body.order;
      if (title !== undefined) module.title = title.trim();
      if (description !== undefined) module.description = description.trim();
      if (orderIndex !== undefined) module.orderIndex = orderIndex;
      if (orderIndex !== undefined) module.order = orderIndex;
      if (isActive !== undefined) module.isActive = isActive;

      await module.save();

      return res.status(200).json({
        success: true,
        message: 'Module updated successfully',
        module,
      });
    } else {
      const module = memoryStore.getModuleById(id);
      if (!module) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }

      const course = memoryStore.getCourseById(module.course);
      const isOwner = course && course.instructor?._id?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only edit modules of your own course.',
        });
      }

      const updated = memoryStore.updateModule(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Module updated successfully',
        module: updated,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete module
 * @route  DELETE /api/modules/:id
 * @access Private (Instructor/Admin owner)
 */
export const deleteModule = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { id } = req.params;

    if (isDbConnected()) {
      const module = await CourseModule.findById(id);
      if (!module) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }

      const course = await Course.findById(module.course);
      const isOwner = course && course.instructor.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only delete modules of your own course.',
        });
      }

      await Lesson.deleteMany({ module: module._id });
      await CourseModule.findByIdAndDelete(module._id);

      return res.status(200).json({
        success: true,
        message: 'Module and its lessons deleted successfully',
      });
    } else {
      const module = memoryStore.getModuleById(id);
      if (!module) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }

      const course = memoryStore.getCourseById(module.course);
      const isOwner = course && course.instructor?._id?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!canEditCourseContent(course, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only delete modules of your own course.',
        });
      }

      memoryStore.deleteModule(id);
      return res.status(200).json({
        success: true,
        message: 'Module and its lessons deleted successfully',
      });
    }
  } catch (error) {
    next(error);
  }
};
