import express from 'express';
import { getPublicCourseCatalog, enrollInCourse, getMyEnrollments, getEnrollmentById } from '../controllers/enrollmentController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/catalog', getPublicCourseCatalog);
router.post('/courses/:id/enroll', protect, authorizeRoles('student'), enrollInCourse);
router.get('/my', protect, authorizeRoles('student'), getMyEnrollments);
router.get('/:id', protect, getEnrollmentById);

export default router;
