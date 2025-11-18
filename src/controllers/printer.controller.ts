import type { Request, Response } from 'express';
import fs from 'fs';
import { promisify } from 'util';
import pdfPrintModel from '../models/printer.model.js';
import path from 'path';
import axios from "axios"
import uploadToFileStack from '../helpes/uploadToFileStack.js';
import "../helpes/cloudinary/index.js"; // Initialize Cloudinary configuration
import { v2 as cloudinary } from "cloudinary";

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
				// Clerks can only see jobs for their admin
				filter.adminId = new mongoose.Types.ObjectId(user.adminId);
			} else if (user.role === "admin" && user.userId) {
				// Admins can see all their jobs
				filter.adminId = new mongoose.Types.ObjectId(user.userId);
			}
		}

		return filter;
	}
	/**
	 * Submit PDF for printing
	 */
	async submitPDF(req: any, res: Response): Promise<void> {
		try {
			const file = req.file as any | undefined;
			const body = req.body;
			const clientId = req.params.id;
			if (!clientId) {
				res.status(400).json({
					success: false,
					message: "Client ID is required",
				});
				return;
			}

			if (!file) {
				res.status(400).json({
					success: false,
					message: "No file uploaded",
				});
				return;
			}

			// Validate required fields from the form
			if (
				!body.artwork ||
				!body.width ||
				!body.height ||
				!body.quantity ||
				!body.location ||
				!body.adminId
			) {
				if (file && file.path) {
					fs.unlinkSync(file.path);
				}
				res.status(400).json({
					success: false,
					message:
						"Missing required fields: artwork, width, height, quantity, location, and adminId are required",
				});
				return;
			}

			// Validate adminId format
			const mongoose = (await import("mongoose")).default;
			if (!mongoose.Types.ObjectId.isValid(body.adminId)) {
				if (file && file.path) {
					fs.unlinkSync(file.path);
				}
				res.status(400).json({
					success: false,
					message: "Invalid adminId format",
				});
				return;
			}

			// Upload file to Cloudinary
			let cloudinaryData: { publicId: string; url: string } | null = null;
			let useCloudinary = false;

			try {
				const uploadResult = await cloudinary.uploader.upload(file.path, {
					resource_type: "auto",
					folder: "print-jobs",
				});

				if (uploadResult && uploadResult.public_id && uploadResult.secure_url) {
					console.log("Cloudinary upload successful:", uploadResult.public_id);
					cloudinaryData = {
						publicId: uploadResult.public_id,
						url: uploadResult.secure_url,
					};
					useCloudinary = true;

					// Delete local file after successful upload
					try {
						fs.unlinkSync(file.path);
					} catch (deleteError) {
						console.warn(
							"Failed to delete local file after Cloudinary upload:",
							deleteError
						);
					}
				} else {
					console.warn(
						"Cloudinary upload returned invalid data:",
						uploadResult
					);
					useCloudinary = false;
				}
			} catch (error: any) {
				console.warn("Cloudinary upload failed, using local file:", error);
				useCloudinary = false;
			}

			// Use Cloudinary data if available, otherwise use local file data
			const printData: Record<string, any> = {
				fileName: file.originalname,
				filePath: cloudinaryData ? cloudinaryData.url : file.path,
				fileSize: file.size,
				originalName: file.originalname,
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
				adminId: new mongoose.Types.ObjectId(body.adminId), // Link job to admin
			};

			// Add Cloudinary-specific fields if upload was successful
			if (cloudinaryData) {
				printData.cloudinaryPublicId = cloudinaryData.publicId;
				printData.cloudinaryUrl = cloudinaryData.url;
			}

			const pdfPrint = new pdfPrintModel(printData);
			await pdfPrint.save();

			console.log("saved ----- ", pdfPrint);
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
				},
			});
		} catch (error: any) {
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

			// Ensure upload directory exists
			if (!fs.existsSync(uploadsDir)) {
				fs.mkdirSync(uploadsDir, { recursive: true });
			}

			const localFilePath = path.join(uploadsDir, fileName);

			// Download the file
			const response = await axios({
				method: "GET",
				url: fileUrl,
				responseType: "stream",
			});

			// Write file to disk
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

			// Filter by adminId based on user role
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
				.limit(limitNum)
				.skip((pageNum - 1) * limitNum)
				.sort({ createdAt: -1 });

			const total = await pdfPrintModel
				.countDocuments(filter)
				.populate("clientId");

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

			// Build adminId filter
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
			const { status, errorMessage } = req.body;
			const user = (req as any).user;

			// Build adminId filter
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

			// Get the print job before update to check for Cloudinary public_id and adminId
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

			// Update with adminId filter to ensure we only update jobs the user has access to
			const printJob = await pdfPrintModel.findOneAndUpdate(
				{ _id: id, ...adminIdFilter },
				updateData,
				{
					new: true,
					runValidators: true,
				}
			);

			if (!printJob) {
				res.status(404).json({
					success: false,
					message: "Print job not found or access denied",
				});
				return;
			}

			// Delete from Cloudinary if status is updated to "completed" and public_id exists
			if (status === "completed" && existingPrintJob.cloudinaryPublicId) {
				try {
					await cloudinary.uploader.destroy(
						existingPrintJob.cloudinaryPublicId
					);
					console.log(
						`Deleted Cloudinary file with public_id: ${existingPrintJob.cloudinaryPublicId}`
					);
				} catch (deleteError: any) {
					console.error("Error deleting file from Cloudinary:", deleteError);
					// Don't fail the request if deletion fails, just log it
				}
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

			// Build adminId filter
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

			// Delete from Cloudinary if public_id exists
			if (printJob.cloudinaryPublicId) {
				try {
					await cloudinary.uploader.destroy(printJob.cloudinaryPublicId);
					console.log(
						`Deleted Cloudinary file with public_id: ${printJob.cloudinaryPublicId}`
					);
				} catch (deleteError: any) {
					console.error("Error deleting file from Cloudinary:", deleteError);
					// Continue with deletion even if Cloudinary deletion fails
				}
			}

			// Delete local file if it exists (fallback for non-Cloudinary uploads)
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
			if (pdfPrint.cloudinaryPublicId) {
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
				.limit(options.limit * 1)
				.skip((options.page - 1) * options.limit)
				.sort(options.sort as any);

			const total = await pdfPrintModel.countDocuments(filter);

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
