import mongoose from "mongoose";

const PDFPrintSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  printerName: {
    type: String,
    default: 'default'
  },
  copies: {
    type: Number,
    default: 1
  },
  duplex: {
    type: Boolean,
    default: false
  },
  color: {
    type: Boolean,
    default: false
  },
  pageRange: {
    type: String
  },
  submittedBy: {
    type: String
  },
  errorMessage: {
    type: String
  },
  printJobId: {
    type: String
  },
  // New FileStack fields
  fileStackUrl: {
    type: String
  },
  fileStackKey: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
PDFPrintSchema.index({ status: 1, createdAt: 1 });
PDFPrintSchema.index({ submittedBy: 1 });

const pdfPrintModel = mongoose.model('PDFPrint', PDFPrintSchema);

export default pdfPrintModel