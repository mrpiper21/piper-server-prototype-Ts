import type { Request, Response } from 'express';
import fs from 'fs';
import { promisify } from 'util';
import pdfPrintModel from '../models/printer.model.js';
import path from 'path';
import axios from "axios"
import uploadToFileStack from '../helpes/uploadToFileStack.js';

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
          message: 'No file uploaded',
        });
        return;
      }
  
  
      // Validate required fields from the form
      if (!body.artwork || !body.width || !body.height || !body.quantity || !body.location) {
        fs.unlinkSync(file.path);
        res.status(400).json({
          success: false,
          message: 'Missing required fields: artwork, width, height, quantity, and location are required',
        });
        return;
      }
  
      // Upload file to FileStack (optional - fallback to local file if fails)
      let fileStackData;
      let useFileStack = false;
      
      try {
        fileStackData = await uploadToFileStack(file.path, file.originalname, file.mimetype);
        // Check if upload was successful (has url and filename)
        if (fileStackData && fileStackData.url && fileStackData.filename) {
          console.log('FileStack upload successful:', fileStackData);
          useFileStack = true;
        } else {
          console.warn('FileStack upload returned invalid data:', fileStackData);
          useFileStack = false;
        }
      } catch (error: any) {
        console.warn('FileStack upload failed, using local file:', error);
        useFileStack = false;
      }
  
      // Use FileStack data if available, otherwise use local file data
      const printData: Record<string, any> = {
        fileName: useFileStack ? fileStackData.filename : file.filename,
        filePath: useFileStack ? fileStackData.url : file.path,
        fileSize: file.size,
        originalName: file.originalname,
        printerName: body.printerName || 'default',
        copies: parseInt(body.copies, 10) || 1,
        duplex: body.duplex === 'true',
        color: body.color === 'true',
        status: 'pending',
        artwork: body.artwork,
        width: body.width,
        height: body.height,
        size: useFileStack ? fileStackData.size : `${body.width} x ${body.height}`,
        quantity: parseInt(body.quantity, 10),
        location: body.location,
        description: body.description || '',
        ...(useFileStack && {
          fileStackUrl: fileStackData.url,
          fileStackKey: fileStackData.key,
        }),
      };
  
      const pdfPrint = new pdfPrintModel(printData);
      await pdfPrint.save();
  
      console.log("saved ----- ", pdfPrint)
      res.status(201).json({
        success: true,
        message: 'File submitted for printing successfully',
        data: {
          id: pdfPrint._id,
          fileName: pdfPrint.fileName,
          artwork: pdfPrint.artwork,
          size: pdfPrint.size,
          quantity: pdfPrint.quantity,
          location: pdfPrint.location,
          status: pdfPrint.status,
          submittedAt: pdfPrint.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Error submitting file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit file for printing',
        error: error.message,
      });
    }
  }

  private async downloadFromFileStack(fileUrl: string, fileName: string): Promise<string> {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
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
