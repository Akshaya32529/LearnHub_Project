import mongoose from 'mongoose';
import User from '../models/User.js';

const ROLES = ['admin', 'instructor', 'reviewer', 'student', 'mentor'];

export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const query = {};
    if (req.query.role) {
      const role = String(req.query.role).toLowerCase();
      if (!ROLES.includes(role)) return res.status(400).json({ success: false, message: 'Invalid user role filter.' });
      query.role = role;
    }
    if (req.query.search) {
      const value = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ name: { $regex: value, $options: 'i' } }, { email: { $regex: value, $options: 'i' } }];
    }
    const [users, total] = await Promise.all([
      User.find(query).select('name email role profile isActive createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    return res.status(200).json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

export const updateUserAccess = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid user identifier.' });
    const { role, isActive } = req.body;
    if (role !== undefined && !ROLES.includes(String(role).toLowerCase())) return res.status(400).json({ success: false, message: 'Invalid user role.' });
    if (isActive !== undefined && typeof isActive !== 'boolean') return res.status(400).json({ success: false, message: 'isActive must be a boolean.' });
    if (req.params.id === req.user._id.toString() && (role && role !== 'admin' || isActive === false)) {
      return res.status(400).json({ success: false, message: 'You cannot remove your own admin access.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (role !== undefined) user.role = String(role).toLowerCase();
    if (isActive !== undefined) user.isActive = isActive;
    await user.save();
    return res.status(200).json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (error) { next(error); }
};
