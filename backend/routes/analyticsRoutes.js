import express from 'express';
import { instructorAnalytics, courseAnalytics } from '../controllers/analyticsController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect, authorizeRoles('instructor', 'admin'));
router.get('/instructor', instructorAnalytics);
router.get('/courses/:courseId', courseAnalytics);
export default router;
