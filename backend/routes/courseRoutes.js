import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController.js';
import { protect, optionalProtect, authorizeRoles } from '../middleware/authMiddleware.js';
import { enrollInCourse } from '../controllers/enrollmentController.js';

const router = express.Router();

// Public/Private course retrieval
router.get('/', optionalProtect, getCourses);
router.get('/:id', optionalProtect, getCourseById);
router.post('/:id/enroll', protect, authorizeRoles('student'), enrollInCourse);

// Instructor / Admin course management
router.post('/', protect, authorizeRoles('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorizeRoles('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorizeRoles('instructor', 'admin'), deleteCourse);

export default router;
