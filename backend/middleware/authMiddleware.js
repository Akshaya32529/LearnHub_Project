import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isDbConnected } from '../config/db.js';

/**
 * Protect route using the signed HTTP-only authentication cookie.
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.cookies?.token) token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing. Please log in.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32 || secret === 'your_jwt_secret_key_here') {
      return res.status(503).json({ success: false, message: 'Authentication is not configured.' });
    }
    const decoded = jwt.verify(token, secret);

    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'Authentication is temporarily unavailable.' });
    }
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
      message: 'Invalid or expired authentication token.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This user account has been deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
};

export const optionalProtect = (req, res, next) => {
  if (!req.cookies?.token) return next();
  return protect(req, res, next);
};

/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'instructor')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication token missing. Please log in.',
      });
    }

    const allowedRoles = roles.map((role) => String(role).toLowerCase());
    const userRole = String(req.user.role || '').toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role || 'Guest'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

// Cross-site HTML forms cannot attach this origin header to cookie-authenticated writes.
export const verifyRequestOrigin = (req, res, next) => {
  const origin = req.get('origin');
  const configuredOrigins = String(process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (origin && !configuredOrigins.includes(origin)) {
    return res.status(403).json({ success: false, message: 'Request origin is not allowed.' });
  }
  next();
};
