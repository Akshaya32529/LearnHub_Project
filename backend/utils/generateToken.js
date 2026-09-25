import jwt from 'jsonwebtoken';

/**
 * Generate JWT token and set HTTP-only cookie on response
 */
export const generateToken = (res, userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret === 'your_jwt_secret_key_here') {
    throw new Error('Authentication is not configured. Set a strong JWT_SECRET.');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const token = jwt.sign({ id: userId }, secret, {
    expiresIn,
  });

  // Set HTTP-only cookie
  if (res) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: parseDurationMs(expiresIn),
      path: '/',
    });
  }

  return token;
};

function parseDurationMs(value) {
  const match = String(value).match(/^(\d+)([smhd])$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Number(match[1]) * units[match[2].toLowerCase()];
}

export default generateToken;
