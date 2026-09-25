import express from 'express';
import {
  getCourseModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
} from '../controllers/moduleController.js';
import { protect, optionalProtect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Course nested modules: /api/courses/:courseId/modules
router.get('/', optionalProtect, getCourseModules);
router.post('/', protect, authorizeRoles('instructor', 'admin'), createModule);

// Direct module operations: /api/modules/:id
export const directModuleRouter = express.Router();
directModuleRouter.get('/:id', optionalProtect, getModuleById);
directModuleRouter.put('/:id', protect, authorizeRoles('instructor', 'admin'), updateModule);
directModuleRouter.delete('/:id', protect, authorizeRoles('instructor', 'admin'), deleteModule);

export default router;
