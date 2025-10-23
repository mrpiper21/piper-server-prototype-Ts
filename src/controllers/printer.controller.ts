import type { Request, Response } from 'express';
import fs from 'fs';
import { promisify } from 'util';
import pdfPrintModel from '../models/printer.model.js';
import path from 'path';
import axios from "axios"

// --- FIX 1: Declare Multer file type manually to avoid namespace issue ---
interface MulterFile {
  /** Name of the file on the server */
  filename: string;
  /** Name of the file on the user's computer */
  originalname: string;
  /** MIME type of the file */
  mimetype: string;
  /** Path to the uploaded file */
  path: string;
  /** Size of the file in bytes */
  size: number;
}

const unlinkAsync = promisify(fs.unlink);

class PrinterController {
  /**
   * Submit PDF for printing
   */
  async submitPDF(req: any, res: Response): Promise<void> {
    try {
      const file = req.file as any | undefined;
      const body = req.body;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No PDF file uploaded',
        });
        return;
      }

      // Validate file type
      if (file.mimetype !== 'application/pdf') {
        fs.unlinkSync(file.path);
        res.status(400).json({
          success: false,
          message: 'Only PDF files are allowed',
        });
        return;
      }

      const printData: Record<string, any> = {
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        originalName: file.originalname,
        mimeType: file.mimetype,
        printerName: body.printerName || 'default',
        copies: parseInt(body.copies, 10) || 1,
        duplex: body.duplex === 'true',
        color: body.color === 'true',
        pageRange: body.pageRange,
        submittedBy: body.submittedBy || 'anonymous',
        status: 'pending',
      };

      const pdfPrint = new pdfPrintModel(printData);
      await pdfPrint.save();

      console.log("saved ----- ", pdfPrint)

      await this.processPrintJob(pdfPrint);

      res.status(201).json({
        success: true,
        message: 'PDF submitted for printing successfully',
        data: {
          id: pdfPrint._id,
          fileName: pdfPrint.fileName,
          status: pdfPrint.status,
          submittedAt: pdfPrint.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Error submitting PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit PDF for printing',
        error: error.message,
      });
    }
  }

  private async downloadFromFileStack(fileUrl: string, fileName: string): Promise<string> {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const localFilePath = path.join(uploadsDir, fileName);

      // Download the file
      const response = await axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream'
      });

      // Write file to disk
      const writer = fs.createWriteStream(localFilePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(localFilePath));
        writer.on('error', reject);
      });

    } catch (error) {
      console.error('Error downloading from FileStack:', error);
      throw new Error(`Failed to download file from FileStack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all print jobs with filtering and pagination
   */
  async getPrintJobs(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '10',
        status,
        submittedBy,
        startDate,
        endDate,
      } = req.query as Record<string, string>;

      const filter: Record<string, any> = {};

      if (status) filter.status = status;
      if (submittedBy) filter.submittedBy = submittedBy;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      const printJobs = await pdfPrintModel
        .find(filter)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ createdAt: -1 });

      const total = await pdfPrintModel.countDocuments(filter);

      res.json({
        success: true,
        data: printJobs,
        pagination: {
          current: pageNum,
          total: Math.ceil(total / limitNum),
          totalRecords: total,
        },
      });
    } catch (error: any) {
      console.error('Error fetching print jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch print jobs',
        error: error.message,
      });
    }
  }

  /**
   * Get single print job by ID
   */
  async getPrintJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const printJob = await pdfPrintModel.findById(id);

      if (!printJob) {
        res.status(404).json({
          success: false,
          message: 'Print job not found',
        });
        return;
      }

      res.json({
        success: true,
        data: printJob,
      });
    } catch (error: any) {
      console.error('Error fetching print job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch print job',
        error: error.message,
      });
    }
  }

  /**
   * Update print job status
   */
  async updatePrintJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, errorMessage } = req.body;

      const validStatuses = ['pending', 'processing', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
        });
        return;
      }

      const updateData: Record<string, any> = { status };
      if (errorMessage) updateData.errorMessage = errorMessage;

      const printJob = await pdfPrintModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!printJob) {
        res.status(404).json({
          success: false,
          message: 'Print job not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Print job status updated successfully',
        data: printJob,
      });
    } catch (error: any) {
      console.error('Error updating print job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update print job',
        error: error.message,
      });
    }
  }

  /**
   * Delete print job
   */
  async deletePrintJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const printJob = await pdfPrintModel.findById(id);

      if (!printJob) {
        res.status(404).json({
          success: false,
          message: 'Print job not found',
        });
        return;
      }

      if (fs.existsSync(printJob.filePath)) {
        fs.unlinkSync(printJob.filePath);
      }

      await pdfPrintModel.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Print job deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting print job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete print job',
        error: error.message,
      });
    }
  }

  /**
   * Process print job (simulated)
   */
  async processPrintJob(pdfPrint: any): Promise<void> {
    try {
      pdfPrint.status = 'processing';
      await pdfPrint.save();

      await new Promise((resolve) => setTimeout(resolve, 2000));

      pdfPrint.status = 'completed';
      pdfPrint.printJobId = `PRINT_${Date.now()}`;
      await pdfPrint.save();

      console.log(`Print job ${pdfPrint._id} processed successfully`);
    } catch (error: any) {
      console.error('Error processing print job:', error);
      pdfPrint.status = 'failed';
      pdfPrint.errorMessage = error.message;
      await pdfPrint.save();
    }
  }

  /**
   * Get print statistics
   */
  async getPrintStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await pdfPrintModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalSize: { $sum: '$fileSize' },
          },
        },
      ]);

      const totalJobs = await pdfPrintModel.countDocuments();
      const completedJobs = await pdfPrintModel.countDocuments({ status: 'completed' });

      res.json({
        success: true,
        data: {
          stats,
          totalJobs,
          completedJobs,
          successRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
        },
      });
    } catch (error: any) {
      console.error('Error fetching print stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch print statistics',
        error: error.message,
      });
    }
  }

  async getPrintJobsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '10',
        status, // Can be comma-separated: 'pending,processing'
        submittedBy,
        startDate,
        endDate
      } = req.query;
  
      const filter: any = {};
      
      // Handle multiple statuses
      if (status) {
        const statuses = (status as string).split(',');
        if (statuses.length > 1) {
          filter.status = { $in: statuses };
        } else {
          filter.status = status;
        }
      }
      
      if (submittedBy) filter.submittedBy = submittedBy;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }
  
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: { createdAt: -1 }
      };
  
      const printJobs = await pdfPrintModel.find(filter)
        .limit(options.limit * 1)
        .skip((options.page - 1) * options.limit)
        .sort(options.sort as any);

      console.log("jobs ------- ", printJobs)
  
      const total = await pdfPrintModel.countDocuments(filter);
  
      res.json({
        success: true,
        data: printJobs,
        pagination: {
          current: options.page,
          total: Math.ceil(total / options.limit),
          totalRecords: total
        }
      });
  
    } catch (error: any) {
      console.error('Error fetching print jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch print jobs',
        error: error.message
      });
    }
  }
}

export default new PrinterController();
