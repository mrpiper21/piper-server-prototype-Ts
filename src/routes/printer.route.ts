import express, { Router } from 'express';
import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import PrinterController from '../controllers/printer.controller.js';

// Create router
const router: Router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/pdfs');
    // Ensure directory exists
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `pdf-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Routes
router.post('/submit', upload.single('pdfFile'), (req, res) => PrinterController.submitPDF(req, res));
router.get('/jobs', (req, res) => PrinterController.getPrintJobs(req, res));
router.get('/jobs/:id', (req, res) => PrinterController.getPrintJob(req, res));
router.put('/jobs/:id/status', (req, res) => PrinterController.updatePrintJobStatus(req, res));
router.delete('/jobs/:id', (req, res) => PrinterController.deletePrintJob(req, res));
router.get('/stats', (req, res) => PrinterController.getPrintStats(req, res));
router.get('/jobs/filter', (req, res) => PrinterController.getPrintJobsByStatus(req, res));

export default router;