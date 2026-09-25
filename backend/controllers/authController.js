import User from '../models/User.js';
import AIRecommendation from '../models/AIRecommendation.js';
import generateToken from '../utils/generateToken.js';
import { isDbConnected } from '../config/db.js';

/**
 * @desc   Register a new user
 * @route  POST /api/auth/register
 * @access Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const rawName = String(req.body.name || '').trim();
    const rawEmail = String(req.body.email || '').trim().toLowerCase();
    const rawPassword = String(req.body.password || '');

    if (!rawName || !rawEmail || !rawPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    const safePassword = rawPassword;

    if (safePassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (req.body.role && String(req.body.role).toLowerCase() !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Public registration is only allowed for the student role.',
      });
    }

    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'Authentication is temporarily unavailable.' });
    }
    const userExists = await User.findOne({ email: rawEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const user = await User.create({
      name: rawName,
      email: rawEmail,
      password: safePassword,
      role: 'student',
    });

    generateToken(res, user._id);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Login user & get token
 * @route  POST /api/auth/login
 * @access Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'Authentication is temporarily unavailable.' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated.',
      });
    }

    generateToken(res, user._id);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get current logged in user
 * @route  GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const updateCurrentUserProfile = async (req, res, next) => {
  try {
    const { learningGoals, bio, avatar } = req.body;
    if (learningGoals !== undefined && (!Array.isArray(learningGoals) || learningGoals.length > 10 || learningGoals.some((goal) => typeof goal !== 'string' || !goal.trim() || goal.length > 100))) {
      return res.status(400).json({ success: false, message: 'Learning goals must be up to 10 non-empty strings of at most 100 characters.' });
    }
    if (bio !== undefined && (typeof bio !== 'string' || bio.length > 500)) return res.status(400).json({ success: false, message: 'Bio must be 500 characters or fewer.' });
    if (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > 2000)) return res.status(400).json({ success: false, message: 'Avatar must be a valid short URL.' });
    const user = req.user;
    if (learningGoals !== undefined) {
      user.profile.learningGoals = [...new Set(learningGoals.map((goal) => goal.trim()))];
      await AIRecommendation.deleteOne({ student: user._id });
    }
    if (bio !== undefined) user.profile.bio = bio.trim();
    if (avatar !== undefined) user.profile.avatar = avatar.trim();
    await user.save();
    return res.status(200).json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role, profile: user.profile } });
  } catch (error) { next(error); }
};

/**
 * @desc   Logout user
 * @route  POST /api/auth/logout
 * @access Private
 */
export const logoutUser = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
