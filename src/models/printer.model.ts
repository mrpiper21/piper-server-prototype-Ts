import mongoose from "mongoose";

const PDFPrintSchema = new mongoose.Schema(
	{
		fileName: {
			type: String,
			required: true,
		},
		filePath: {
			type: String,
			required: true,
		},
		fileSize: {
			type: Number,
			required: true,
		},
		originalName: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "processing", "completed", "failed"],
			default: "pending",
		},
		printerName: {
			type: String,
			default: "default",
		},
		copies: {
			type: Number,
			default: 1,
		},
		duplex: {
			type: Boolean,
			default: false,
		},
		color: {
			type: Boolean,
			default: false,
		},
		printJobId: {
			type: String,
		},
		fileStackUrl: {
			type: String,
		},
		fileStackKey: {
			type: String,
		},
		cloudinaryPublicId: {
			type: String,
		},
		cloudinaryUrl: {
			type: String,
		},
		artwork: {
			type: String,
			required: true,
		},
		width: {
			type: String,
			required: true,
		},
		height: {
			type: String,
			required: true,
		},
		size: {
			type: String,
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			default: 1,
		},
		location: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: "",
		},
		submittedBy: {
			type: String,
			default: "frontend-user",
		},
	},
	{
		timestamps: true,
	}
);

// Index for better query performance
PDFPrintSchema.index({ status: 1, createdAt: 1 });
PDFPrintSchema.index({ submittedBy: 1 });
PDFPrintSchema.index({ location: 1 });
PDFPrintSchema.index({ artwork: 1 });

const pdfPrintModel = mongoose.model('PDFPrint', PDFPrintSchema);

export default pdfPrintModel