import express from 'express';
import { getCourseQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz, createQuestion, updateQuestion, deleteQuestion, startQuizAttempt, submitQuizAttempt, getQuizAttempts, getStudentQuizHistory } from '../controllers/quizController.js';
import { protect, optionalProtect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.get('/courses/:courseId/quizzes', optionalProtect, getCourseQuizzes);
router.get('/quizzes/:id', optionalProtect, getQuizById);
router.post('/courses/:courseId/quizzes', protect, authorizeRoles('instructor', 'admin'), createQuiz);
router.put('/quizzes/:id', protect, authorizeRoles('instructor', 'admin'), updateQuiz);
router.delete('/quizzes/:id', protect, authorizeRoles('instructor', 'admin'), deleteQuiz);
router.post('/quizzes/:quizId/questions', protect, authorizeRoles('instructor', 'admin'), createQuestion);
router.put('/quizzes/:quizId/questions/:questionId', protect, authorizeRoles('instructor', 'admin'), updateQuestion);
router.delete('/quizzes/:quizId/questions/:questionId', protect, authorizeRoles('instructor', 'admin'), deleteQuestion);
router.post('/quizzes/:id/start', protect, authorizeRoles('student'), startQuizAttempt);
router.post('/quizzes/:id/attempts', protect, authorizeRoles('student'), submitQuizAttempt);
router.get('/quizzes/:id/history', protect, authorizeRoles('student'), getStudentQuizHistory);
router.get('/quizzes/:id/attempts', protect, authorizeRoles('instructor', 'admin', 'reviewer'), getQuizAttempts);

export default router;
