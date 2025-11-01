import express, { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
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
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Ensure directory exists
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `file-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Allowed file types
  const allowedMimeTypes = [
    // PDF
    'application/pdf',
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    // Documents
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    // Text files
    'text/plain',
    'text/csv',
    // Other
    'application/postscript', // .ps, .eps
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`);
    cb(error);
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
router.post('/submit/client/:id', upload.single('pdfFile'), (req: Request, res: Response) => PrinterController.submitPDF(req, res));
router.get('/jobs', (req: Request, res: Response) => PrinterController.getPrintJobs(req, res));
router.get('/jobs/:id', (req: Request, res: Response) => PrinterController.getPrintJob(req, res));
router.put('/jobs/:id/status', (req: Request, res: Response) => PrinterController.updatePrintJobStatus(req, res));
router.delete('/jobs/:id', (req: Request, res: Response) => PrinterController.deletePrintJob(req, res));
router.get('/stats', (req: Request, res: Response) => PrinterController.getPrintStats(req, res));
router.get('/jobs/filter', (req: Request, res: Response) => PrinterController.getPrintJobsByStatus(req, res));

export default router;