import express from 'express';
import { getCourseAssignments, createAssignment, updateAssignment, deleteAssignment, submitAssignment, gradeSubmission, getAssignmentSubmissions, getMyAssignmentSubmission } from '../controllers/assignmentController.js';
import { protect, optionalProtect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.get('/courses/:courseId/assignments', optionalProtect, getCourseAssignments);
router.post('/courses/:courseId/assignments', protect, authorizeRoles('instructor', 'admin'), createAssignment);
router.put('/assignments/:id', protect, authorizeRoles('instructor', 'admin'), updateAssignment);
router.delete('/assignments/:id', protect, authorizeRoles('instructor', 'admin'), deleteAssignment);
router.post('/assignments/:id/submit', protect, authorizeRoles('student'), submitAssignment);
router.get('/assignments/:id/my-submission', protect, authorizeRoles('student'), getMyAssignmentSubmission);
router.post('/assignments/submissions/:id/grade', protect, authorizeRoles('instructor', 'admin'), gradeSubmission);
router.get('/assignments/:id/submissions', protect, authorizeRoles('instructor', 'admin'), getAssignmentSubmissions);

export default router;
