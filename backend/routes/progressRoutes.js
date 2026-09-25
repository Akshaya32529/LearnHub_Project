import express from 'express';
import { getMyProgress, updateProgressLesson, issueCertificate, getStudentCertificates } from '../controllers/progressController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my', protect, authorizeRoles('student'), getMyProgress);
router.post('/courses/:courseId/lesson-progress', protect, authorizeRoles('student'), updateProgressLesson);
router.post('/courses/:courseId/certificate', protect, authorizeRoles('student'), issueCertificate);
router.get('/certificates', protect, authorizeRoles('student'), getStudentCertificates);

export default router;
