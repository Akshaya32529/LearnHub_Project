import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import courseRoutes from './courseRoutes.js';
import moduleRoutes, { directModuleRouter } from './moduleRoutes.js';
import lessonRoutes, { directLessonRouter } from './lessonRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import enrollmentRoutes from './enrollmentRoutes.js';
import quizRoutes from './quizRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import progressRoutes from './progressRoutes.js';
import mentorRoutes from './mentorRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import aiRoutes from './aiRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

// System Health Check
router.use('/health', healthRoutes);

// Authentication & Users
router.use('/auth', authRoutes);

// Categories
router.use('/categories', categoryRoutes);

// Courses
router.use('/courses', courseRoutes);
router.use('/reviews', reviewRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/', quizRoutes);
router.use('/', assignmentRoutes);
router.use('/progress', progressRoutes);
router.use('/mentors', mentorRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

// Nested: /api/courses/:courseId/modules
router.use('/courses/:courseId/modules', moduleRoutes);

// Direct: /api/modules/:id
router.use('/modules', directModuleRouter);

// Nested: /api/modules/:moduleId/lessons
router.use('/modules/:moduleId/lessons', lessonRoutes);

// Direct: /api/lessons/:id
router.use('/lessons', directLessonRouter);

export default router;
