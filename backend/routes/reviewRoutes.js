import express from 'express';
import { getReviewQueue, updateCourseReview, submitCourseForReview, getCourseReviewHistory } from '../controllers/reviewController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/queue', protect, authorizeRoles('reviewer', 'admin'), getReviewQueue);
router.post('/courses/:id/submit', protect, authorizeRoles('instructor', 'admin'), submitCourseForReview);
router.post('/courses/:id/review', protect, authorizeRoles('reviewer', 'admin'), updateCourseReview);
router.get('/courses/:id/history', protect, getCourseReviewHistory);

export default router;
