import express from 'express';
import { listUsers, updateUserAccess } from '../controllers/adminUserController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect, authorizeRoles('admin'));
router.get('/users', listUsers);
router.patch('/users/:id', updateUserAccess);
export default router;
