import express from 'express';
import { learningPath, weakConcepts, recommendations, assessmentFeedback } from '../controllers/aiController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect, authorizeRoles('student'));
router.get('/learning-path', learningPath);
router.get('/weak-concepts', weakConcepts);
router.get('/recommendations', recommendations);
router.post('/assessment-feedback', assessmentFeedback);
export default router;
