import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();
// import { logger } from '../logger.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	console.error("❌ MONGODB_URI is not defined in environment variables");
	process.exit(1);
}

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.info('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.info('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected');
});

// Close connection when app is terminated
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.info('Mongoose connection closed through app termination');
  process.exit(0);
});