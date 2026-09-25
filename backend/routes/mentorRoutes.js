import express from 'express';
import { assignMentor, updateMentorAssignment, getMentorAssignments, createMentorFeedback, createMentoringSession, getMySessions, updateMentoringSession, getMentorFeedback } from '../controllers/mentorController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/assign', protect, authorizeRoles('admin'), assignMentor);
router.patch('/assignments/:id', protect, authorizeRoles('admin'), updateMentorAssignment);
router.get('/assignments', protect, authorizeRoles('admin', 'mentor', 'student'), getMentorAssignments);
router.get('/feedback', protect, authorizeRoles('admin', 'mentor', 'student'), getMentorFeedback);
router.post('/feedback', protect, authorizeRoles('mentor'), createMentorFeedback);
router.post('/sessions', protect, authorizeRoles('mentor'), createMentoringSession);
router.get('/sessions', protect, authorizeRoles('admin', 'mentor', 'student'), getMySessions);
router.patch('/sessions/:id', protect, authorizeRoles('admin', 'mentor'), updateMentoringSession);

export default router;
