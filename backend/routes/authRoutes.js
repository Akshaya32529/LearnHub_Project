import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUserProfile,
  logoutUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getCurrentUser);
router.patch('/me/profile', protect, updateCurrentUserProfile);

export default router;
