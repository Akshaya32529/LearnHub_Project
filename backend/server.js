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

// Middleware
const allowedOrigins = String(process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: "https://learn-hub-project-pn52tuvfj-akshaya-reddy-vanga-s-projects.vercel.app/",
    credentials: true,
  })
);

app.use(verifyRequestOrigin);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to LearnHub API – Skill Learning & Assessment Platform',
    version: '1.0.0',
    documentation: '/api/health',
    status: 'online',
  });
});

// Mount Central API Routes
app.use('/api', apiRoutes);

// Fallback & Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 LearnHub Server is running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`🩺 Health check available at: http://localhost:${PORT}/api/health`);
});

export default app;
