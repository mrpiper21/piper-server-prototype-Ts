import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import printerRoutes from './routes/printer.route.js';
import multer from 'multer';
import mongoose from 'mongoose';
import morgan from 'morgan'
import { connectDB } from './db/connection.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'))


connectDB()
// Routes
app.use('/api/print', printerRoutes);


// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB',
      });
    }
  }

  res.status(500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
});

// MongoDB connection

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 PDF Printer API server running on port ${PORT}`);
});
