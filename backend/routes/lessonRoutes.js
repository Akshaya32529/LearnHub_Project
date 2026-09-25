import express from 'express';
import {
  getModuleLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../controllers/lessonController.js';
import { protect, optionalProtect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Module nested lessons: /api/modules/:moduleId/lessons
router.get('/', optionalProtect, getModuleLessons);
router.post('/', protect, authorizeRoles('instructor', 'admin'), createLesson);

// Direct lesson operations: /api/lessons/:id
export const directLessonRouter = express.Router();
directLessonRouter.get('/:id', optionalProtect, getLessonById);
directLessonRouter.put('/:id', protect, authorizeRoles('instructor', 'admin'), updateLesson);
directLessonRouter.delete('/:id', protect, authorizeRoles('instructor', 'admin'), deleteLesson);

export default router;
