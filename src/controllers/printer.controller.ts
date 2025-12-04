import type { Request, Response } from 'express';
import fs from 'fs';
import { promisify } from 'util';
import pdfPrintModel from '../models/printer.model.js';
import path from 'path';
import axios from "axios"
import uploadToFileStack from '../helpes/uploadToFileStack.js';
import {
	cloudinary,
	isCloudinaryConfigured,
} from "../helpes/cloudinary/index.js";
import { UserRole } from "../models/shared/enums.js";
import { notifyClerksOfNewPrintJob } from "../services/printJobNotification.service.js";
import { notifyClientOfJobCompletion } from "../services/clientNotification.service.js";
import Category from "../models/category.model.js";

const unlinkAsync = promisify(fs.unlink);

class PrinterController {
	/**
	 * Helper method to build adminId filter based on user role
	 * Clerks can only access jobs for their admin
	 * Admins can only access their own jobs
	 */
	private async buildAdminIdFilter(user: any): Promise<Record<string, any>> {
		const filter: Record<string, any> = {};

		if (user) {
			const mongoose = (await import("mongoose")).default;
			if (user.adminId) {
				filter.adminId = new mongoose.Types.ObjectId(user.adminId);
			} else if (user.role === "admin" && user.userId) {
				filter.adminId = new mongoose.Types.ObjectId(user.userId);
			}
		}

		return filter;
	}
	/**
	 * Validate file upload request
	 * File upload is optional for result forms (wassce_result, bece_result, novdec_result)
	 */
	private async validateFileUpload(
		file: any,
		body: any,
		clientId: string
	): Promise<{ isValid: boolean; error?: string }> {
		if (!clientId) {
			return { isValid: false, error: "Client ID is required" };
		}

		const mongoose = (await import("mongoose")).default;
		let isResultForm = false;

		if (body.categoryId && mongoose.Types.ObjectId.isValid(body.categoryId)) {
			const Category = (await import("../models/category.model.js")).default;
			const category = await Category.findById(body.categoryId);
			if (category) {
				const resultFormTypes = [
					"wassce_result",
					"bece_result",
					"novdec_result",
				];
				isResultForm = resultFormTypes.includes(category.categoryType);
			}
		}

		if (!isResultForm && !file) {
			return { isValid: false, error: "No file uploaded" };
		}

		if (!body.adminId || !body.categoryId) {
			return {
				isValid: false,
				error: "Missing required fields: adminId, and categoryId are required",
			};
		}

		if (!mongoose.Types.ObjectId.isValid(body.adminId)) {
			return { isValid: false, error: "Invalid adminId format" };
		}

		if (!mongoose.Types.ObjectId.isValid(body.categoryId)) {
			return { isValid: false, error: "Invalid categoryId format" };
		}

		return { isValid: true };
	}

	/**
	 * Upload file to Cloudinary if configured
	 * Returns null if no file is provided
	 */
	private async uploadToCloudinary(
		file: any
	): Promise<{ publicId: string; url: string } | null> {
		if (!file) {
			return null;
		}

		if (!isCloudinaryConfigured()) {
			console.log("Cloudinary not configured, using local file storage");
			return null;
		}

		try {
			const isPDF =
				file.mimetype === "application/pdf" ||
				file.originalname.toLowerCase().endsWith(".pdf");
			const resourceType = isPDF ? "raw" : "auto";

			const uploadResult = await cloudinary.uploader.upload(file.path, {
				resource_type: resourceType,
				folder: "print-jobs",
			});

			if (uploadResult && uploadResult.public_id && uploadResult.secure_url) {
				try {
					fs.unlinkSync(file.path);
				} catch (deleteError) {
					console.warn(
						"Failed to delete local file after Cloudinary upload:",
						deleteError
					);
				}

				return {
					publicId: uploadResult.public_id,
					url: uploadResult.secure_url,
				};
			} else {
				console.warn("Cloudinary upload returned invalid data:", uploadResult);
				return null;
			}
		} catch (error: any) {
			console.warn("Cloudinary upload failed, using local file:", error);
			return null;
		}
	}

	/**
	 * Prepare print job data
	 * Handles cases where file may be optional (e.g., result forms)
	 */
	private async preparePrintJobData(
		file: any,
		body: any,
		clientId: string,
		categoryId: string,
		indexNumber: string,
		dateOfBirth: string,
		yearOfCompletion: string,
		cloudinaryData: { publicId: string; url: string } | null
	): Promise<Record<string, any>> {
		const mongoose = (await import("mongoose")).default;

		const printData: Record<string, any> = {
			printerName: body.printerName || "default",
			copies: parseInt(body.copies, 10) || 1,
			duplex: body.duplex === "true",
			color: body.color === "true",
			status: "pending",
			artwork: body.artwork,
			width: body.width,
			height: body.height,
			size: `${body.width} x ${body.height}`,
			quantity: parseInt(body.quantity, 10),
			location: body.location,
			description: body.description || "",
			clientId: clientId,
			adminId: new mongoose.Types.ObjectId(body.adminId),
			categoryId: new mongoose.Types.ObjectId(categoryId),
			indexNumber: indexNumber,
			dateOfBirth: dateOfBirth,
			yearOfCompletion: yearOfCompletion,
		};

		if (file) {
			printData.fileName = file.originalname;
			printData.filePath = cloudinaryData ? cloudinaryData.url : file.path;
			printData.fileSize = file.size;
			printData.originalName = file.originalname;
		}

		if (cloudinaryData) {
			printData.cloudinaryPublicId = cloudinaryData.publicId;
			printData.cloudinaryUrl = cloudinaryData.url;
		}

		return printData;
	}

	/**
	 * Clean up file on error
	 */
	private cleanupFile(file: any): void {
		if (file && file.path && fs.existsSync(file.path)) {
			try {
				fs.unlinkSync(file.path);
			} catch (error) {
				console.warn("Failed to cleanup file:", error);
			}
		}
	}

	/**
	 * Submit PDF for printing
	 */
	async submitPDF(req: any, res: Response): Promise<void> {
		const file = req.file as any | undefined;
		const body = req.body;
		const clientId = req.params.id;

		try {
			const validation = await this.validateFileUpload(file, body, clientId);
			if (!validation.isValid) {
				if (file) {
					this.cleanupFile(file);
				}
				res.status(400).json({
					success: false,
					message: validation.error,
				});
				return;
			}

			const cloudinaryData = await this.uploadToCloudinary(file);

			const printData = await this.preparePrintJobData(
				file,
				body,
				clientId,
				body?.categoryId || "",
				body?.indexNumber || "",
				body?.dateOfBirth || "",
				body?.yearOfCompletion || "",
				cloudinaryData
			);

			if (body.paymentReference) {
				printData.paymentReference = body.paymentReference;
				printData.paymentStatus = body.paymentStatus || "paid";
				if (body.totalPrice !== undefined) {
					printData.totalPrice = parseFloat(body.totalPrice);
				}
				if (body.paidAt) {
					printData.paidAt = new Date(body.paidAt);
				}
			}

			const pdfPrint = new pdfPrintModel(printData);
			await pdfPrint.save();

			const category = await Category.findById(body.categoryId);

			// Send email notifications to clerks (non-blocking)
			// notifyClerksOfNewPrintJob(body.adminId, {
			// 	fileName: pdfPrint?.fileName ?? null,
			// 	artwork: pdfPrint.artwork || "",
			// 	size: pdfPrint.size || "",
			// 	quantity: pdfPrint.quantity || 0,
			// 	location: pdfPrint.location || "",
			// 	jobId: pdfPrint._id.toString(),
			// 	submittedAt: pdfPrint.createdAt || new Date(),
			// 	...(category?.categoryType && { categoryType: String(category.categoryType) }),
			// 	...(category?.name && { categoryName: String(category.name) }),
			// } as any).catch((error) => {
			// 	console.error("Failed to send email notifications:", error);
			// 	// Don't fail the request if email fails
			// });

			// Return success response
			res.status(201).json({
				success: true,
				message: "File submitted for printing successfully",
				data: {
					id: pdfPrint._id,
					fileName: pdfPrint.fileName,
					artwork: pdfPrint.artwork,
					size: pdfPrint.size,
					quantity: pdfPrint.quantity,
					location: pdfPrint.location,
					status: pdfPrint.status,
					submittedAt: pdfPrint.createdAt,
					...(pdfPrint.totalPrice && { totalPrice: pdfPrint.totalPrice }),
					...(pdfPrint.paymentStatus && { paymentStatus: pdfPrint.paymentStatus }),
					...(pdfPrint.paymentReference && { paymentReference: pdfPrint.paymentReference }),
				},
			});
		} catch (error: any) {
			if (file) {
				this.cleanupFile(file);
			}

			console.error("Error submitting file:", error);
			res.status(500).json({
				success: false,
				message: "Failed to submit file for printing",
				error: error.message,
			});
		}
	}

	private async downloadFromFileStack(
		fileUrl: string,
		fileName: string
	): Promise<string> {
		try {
			const uploadsDir = path.join(process.cwd(), "uploads");

			if (!fs.existsSync(uploadsDir)) {
				fs.mkdirSync(uploadsDir, { recursive: true });
			}

			const localFilePath = path.join(uploadsDir, fileName);

			const response = await axios({
				method: "GET",
				url: fileUrl,
				responseType: "stream",
			});

			const writer = fs.createWriteStream(localFilePath);
			response.data.pipe(writer);

			return new Promise((resolve, reject) => {
				writer.on("finish", () => resolve(localFilePath));
				writer.on("error", reject);
			});
		} catch (error) {
			console.error("Error downloading from FileStack:", error);
			throw new Error(
				`Failed to download file from FileStack: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	/**
	 * Get all print jobs with filtering and pagination
	 * Clerks can only see jobs for their admin
	 * Admins can see all their jobs
	 */
	async getPrintJobs(req: Request, res: Response): Promise<void> {
		try {
			const {
				page = "1",
				limit = "10",
				status,
				submittedBy,
				startDate,
				endDate,
			} = req.query as Record<string, string>;

			const filter: Record<string, any> = {};

			const user = (req as any).user;
			const adminIdFilter = await this.buildAdminIdFilter(user);
			Object.assign(filter, adminIdFilter);

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
				.populate("categoryId")
				.populate("clientId")
				.limit(limitNum)
				.skip((pageNum - 1) * limitNum)
				.sort({ createdAt: -1 });

			const total = await pdfPrintModel
				.countDocuments(filter)
				.populate("clientId")
				.populate("categoryId");

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
			console.error("Error fetching print jobs:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch print jobs",
				error: error.message,
			});
		}
	}

	/**
	 * Get single print job by ID
	 * Clerks can only access jobs for their admin
	 */
	async getPrintJob(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const user = (req as any).user;

			const adminIdFilter = await this.buildAdminIdFilter(user);

			const printJob = await pdfPrintModel
				.findOne({
					_id: id,
					...adminIdFilter,
				})
				.populate("categoryId")
				.populate("clientId");

			if (!printJob) {
				res.status(404).json({
					success: false,
					message: "Print job not found or access denied",
				});
				return;
			}

			res.json({
				success: true,
				data: printJob,
			});
		} catch (error: any) {
			console.error("Error fetching print job:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch print job",
				error: error.message,
			});
		}
	}

	/**
	 * Update print job status
	 * Clerks can only update jobs for their admin
	 */
	async updatePrintJobStatus(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { status, errorMessage, sendReportEmailToClient } = req.body;
			const user = (req as any).user;

			const adminIdFilter = await this.buildAdminIdFilter(user);

			const validStatuses = ["pending", "processing", "completed", "failed"];
			if (!validStatuses.includes(status)) {
				res.status(400).json({
					success: false,
					message:
						"Invalid status. Must be one of: " + validStatuses.join(", "),
				});
				return;
			}

			const existingPrintJob = await pdfPrintModel.findOne({
				_id: id,
				...adminIdFilter,
			});

			if (!existingPrintJob) {
				res.status(404).json({
					success: false,
					message: "Print job not found or access denied",
				});
				return;
			}

			const updateData: Record<string, any> = { status };
			if (errorMessage) updateData.errorMessage = errorMessage;

			const printJob = await pdfPrintModel
				.findOneAndUpdate(
					{ _id: id, ...adminIdFilter },
					{
						...updateData,
						executedBy: user._id,
						executedByModel: user.role === UserRole.ADMIN ? "User" : "Clerk",
					},
					{
						new: true,
						runValidators: true,
					}
				)
				.populate("categoryId");

			if (!printJob) {
				res.status(404).json({
					success: false,
					message: "Print job not found or access denied",
				});
				return;
			}

			if (
				status === "completed" &&
				existingPrintJob.cloudinaryPublicId &&
				isCloudinaryConfigured()
			) {
				try {
					await cloudinary.uploader.destroy(
						existingPrintJob.cloudinaryPublicId
					);
					console.log(
						`Deleted Cloudinary file with public_id: ${existingPrintJob.cloudinaryPublicId}`
					);
				} catch (deleteError: any) {
					console.error("Error deleting file from Cloudinary:", deleteError);
				}
			}

			if (status === "completed" && sendReportEmailToClient === true) {
				const category = printJob.categoryId as any;
				const emailData: any = {
					clientName: "", // Will be fetched in the service
					fileName: printJob.fileName || null,
					artwork: printJob.artwork || "",
					size: printJob.size || "",
					quantity: printJob.quantity || 0,
					location: printJob.location || "",
					jobId: printJob._id.toString(),
					completedAt: printJob.updatedAt || new Date(),
				};

				if (category?.categoryType) {
					emailData.categoryType = String(category.categoryType);
				}
				if (category?.name) {
					emailData.categoryName = String(category.name);
				}
				if (printJob.indexNumber) {
					emailData.indexNumber = String(printJob.indexNumber);
				}
				if (printJob.dateOfBirth) {
					emailData.dateOfBirth = String(printJob.dateOfBirth);
				}
				if (printJob.yearOfCompletion) {
					emailData.yearOfCompletion = String(printJob.yearOfCompletion);
				}

				notifyClientOfJobCompletion(
					printJob.clientId.toString(),
					emailData
				).catch((error) => {
					console.error("Failed to send client completion email:", error);
				});
			}

			res.json({
				success: true,
				message: "Print job status updated successfully",
				data: printJob,
			});
		} catch (error: any) {
			console.error("Error updating print job:", error);
			res.status(500).json({
				success: false,
				message: "Failed to update print job",
				error: error.message,
			});
		}
	}

	/**
	 * Delete print job
	 * Clerks can only delete jobs for their admin
	 * Admins can only delete their own jobs
	 */
	async deletePrintJob(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const user = (req as any).user;

			const adminIdFilter = await this.buildAdminIdFilter(user);

			const printJob = await pdfPrintModel.findOne({
				_id: id,
				...adminIdFilter,
			});

			if (!printJob) {
				res.status(404).json({
					success: false,
					message: "Print job not found or access denied",
				});
				return;
			}

			if (printJob.cloudinaryPublicId && isCloudinaryConfigured()) {
				try {
					await cloudinary.uploader.destroy(printJob.cloudinaryPublicId);
					console.log(
						`Deleted Cloudinary file with public_id: ${printJob.cloudinaryPublicId}`
					);
				} catch (deleteError: any) {
					console.error("Error deleting file from Cloudinary:", deleteError);
				}
			}

			if (printJob.filePath && fs.existsSync(printJob.filePath)) {
				try {
					fs.unlinkSync(printJob.filePath);
				} catch (deleteError: any) {
					console.error("Error deleting local file:", deleteError);
				}
			}

			// Delete with adminId filter to ensure we only delete jobs the user has access to
			await pdfPrintModel.findOneAndDelete({ _id: id, ...adminIdFilter });

			res.json({
				success: true,
				message: "Print job deleted successfully",
			});
		} catch (error: any) {
			console.error("Error deleting print job:", error);
			res.status(500).json({
				success: false,
				message: "Failed to delete print job",
				error: error.message,
			});
		}
	}

	/**
	 * Process print job (simulated)
	 */
	async processPrintJob(pdfPrint: any): Promise<void> {
		try {
			pdfPrint.status = "processing";
			await pdfPrint.save();

			await new Promise((resolve) => setTimeout(resolve, 2000));

			pdfPrint.status = "completed";
			pdfPrint.printJobId = `PRINT_${Date.now()}`;
			await pdfPrint.save();

			// Delete from Cloudinary if public_id exists
			if (pdfPrint.cloudinaryPublicId && isCloudinaryConfigured()) {
				try {
					await cloudinary.uploader.destroy(pdfPrint.cloudinaryPublicId);
					console.log(
						`Deleted Cloudinary file with public_id: ${pdfPrint.cloudinaryPublicId}`
					);
				} catch (deleteError: any) {
					console.error("Error deleting file from Cloudinary:", deleteError);
					// Don't fail the process if deletion fails, just log it
				}
			}

			console.log(`Print job ${pdfPrint._id} processed successfully`);
		} catch (error: any) {
			console.error("Error processing print job:", error);
			pdfPrint.status = "failed";
			pdfPrint.errorMessage = error.message;
			await pdfPrint.save();
		}
	}

	/**
	 * Get print statistics
	 * Clerks can only see stats for jobs submitted to their admin
	 * Admins can only see stats for their own jobs
	 */
	async getPrintStats(req: Request, res: Response): Promise<void> {
		try {
			const user = (req as any).user;

			// Build adminId filter
			const adminIdFilter = await this.buildAdminIdFilter(user);

			const stats = await pdfPrintModel.aggregate([
				{
					$match: adminIdFilter,
				},
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
						totalSize: { $sum: "$fileSize" },
					},
				},
			]);

			const totalJobs = await pdfPrintModel.countDocuments(adminIdFilter);
			const completedJobs = await pdfPrintModel.countDocuments({
				...adminIdFilter,
				status: "completed",
			});

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
			console.error("Error fetching print stats:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch print statistics",
				error: error.message,
			});
		}
	}

	async getPrintJobsByStatus(req: Request, res: Response): Promise<void> {
		try {
			const {
				page = "1",
				limit = "10",
				status, // Can be comma-separated: 'pending,processing'
				submittedBy,
				startDate,
				endDate,
			} = req.query;

			const filter: any = {};

			// Filter by adminId based on user role
			const user = (req as any).user;
			const adminIdFilter = await this.buildAdminIdFilter(user);
			Object.assign(filter, adminIdFilter);

			// Handle multiple statuses
			if (status) {
				const statuses = (status as string).split(",");
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
				sort: { createdAt: -1 },
			};

			const printJobs = await pdfPrintModel
				.find(filter)
				.populate("categoryId")
				.limit(options.limit * 1)
				.skip((options.page - 1) * options.limit)
				.sort(options.sort as any);

			const total = await pdfPrintModel
				.countDocuments(filter)
				.populate("categoryId");

			res.json({
				success: true,
				data: printJobs,
				pagination: {
					current: options.page,
					total: Math.ceil(total / options.limit),
					totalRecords: total,
				},
			});
		} catch (error: any) {
			console.error("Error fetching print jobs:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch print jobs",
				error: error.message,
			});
		}
	}
}

export default new PrinterController();
