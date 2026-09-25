import { getDatabaseStatus } from '../config/db.js';

/**
 * @desc   Check API and server health status
 * @route  GET /api/health
 * @access Public
 */
export const getHealthStatus = (req, res) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    success: true,
    platform: 'LearnHub – Skill Learning & Assessment Platform',
    status: 'online',
    message: 'LearnHub API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: dbStatus,
    activeModule: 'Module 1: Project Foundation and Initial Setup'
  });
};
