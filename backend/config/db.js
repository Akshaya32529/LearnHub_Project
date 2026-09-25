import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 */
export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.warn('⚠️ Warning: MONGO_URI environment variable is not defined.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500, // Timeout after 2.5s if not reachable
    });
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn('MongoDB connection failed. Database backed endpoints will be unavailable until the database is reachable.');
  }
};

/**
 * Helper to check if live MongoDB connection is ready
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Check current database connection status
 */
export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;
  return {
    state: states[readyState] || 'disconnected',
    isConnected: readyState === 1,
    databaseName: mongoose.connection.name || (readyState === 1 ? 'learnhub_db' : 'not connected'),
  };
};

export default connectDB;

