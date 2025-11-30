import mongoose, { Schema } from "mongoose";

const PDFPrintSchema = new mongoose.Schema(
	{
		fileName: {
			type: String,
			required: false,
		},
		filePath: {
			type: String,
			required: false,
		},
		fileSize: {
			type: Number,
			required: false,
		},
		originalName: {
			type: String,
			required: false,
		},
		clientId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Client",
			required: true,
		},
		indexNumber: {
			type: String,
			required: false,
		},
		dateOfBirth: {
			type: String,
			required: false,
		},
		yearOfCompletion: {
			type: String,
			required: false,
		},
		adminId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		categoryId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
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
			required: false,
		},
		width: {
			type: String,
			required: false,
		},
		height: {
			type: String,
			required: false,
		},
		size: {
			type: String,
			required: false,
		},
		quantity: {
			type: Number,
			required: false,
			default: 1,
		},
		location: {
			type: String,
			required: false,
		},
		description: {
			type: String,
			default: "",
		},
		executedByModel: {
			type: String,
			enum: ["Clerk", "User"],
		},
		executedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "executedByModel",
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
PDFPrintSchema.index({ adminId: 1, status: 1 }); // Index for querying jobs by admin

const pdfPrintModel = mongoose.model("PDFPrint", PDFPrintSchema);

export default pdfPrintModel;