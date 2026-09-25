import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';
import { verifyRequestOrigin } from './middleware/authMiddleware.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// ==========================================
// CORS CONFIGURATION
// ==========================================

const allowedOrigins = String(
  process.env.CLIENT_URL || 'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as direct server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

// ==========================================
// GENERAL MIDDLEWARE
// ==========================================

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// ROOT WELCOME ROUTE
// ==========================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message:
      'Welcome to LearnHub API – Skill Learning & Assessment Platform',
    version: '1.0.0',
    documentation: '/api/health',
    status: 'online',
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================

// Keep health check before request-origin verification
// so Render/Vercel health checks can reach it.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API health status online',
    status: 'online',
  });
});

// ==========================================
// REQUEST ORIGIN VERIFICATION
// ==========================================

app.use(verifyRequestOrigin);

// ==========================================
// CENTRAL API ROUTES
// ==========================================

app.use('/api', apiRoutes);

// ==========================================
// FALLBACK & ERROR HANDLING
// ==========================================

app.use(notFound);
app.use(errorHandler);

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `🚀 LearnHub Server is running on port ${PORT} [${
      process.env.NODE_ENV || 'development'
    }]`
  );

  console.log(
    `🩺 Health check available at: http://localhost:${PORT}/api/health`
  );
});

export default app;