import type { Request, Response } from 'express';
import { validationResult } from "express-validator";
import supportModel from "../models/support.model.js";
import pdfPrintModel from "../models/printer.model.js";
import Client from "../models/client.model.js";
import mongoose from "mongoose";

export class SupportController {
	/**
	 * Helper method to build adminId filter based on user role
	 * Clerks can only access support tickets for their admin
	 * Admins can only access their own support tickets
	 */
	private static async buildAdminIdFilter(user: any): Promise<Record<string, any>> {
		const filter: Record<string, any> = {};

		if (user) {
			if (user.adminId) {
				// Clerks can only see support tickets for their admin
				filter.adminId = new mongoose.Types.ObjectId(user.adminId);
			} else if (user.role === "admin" && user.userId) {
				// Admins can see all their support tickets
				filter.adminId = new mongoose.Types.ObjectId(user.userId);
			}
		}

		return filter;
	}

	/**
	 * Create a new support ticket
	 * @route POST /api/support
	 * @access Public (no authentication required)
	 */
	static async createSupportTicket(req: Request, res: Response): Promise<void> {
		try {
			// Check for validation errors
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({
					success: false,
					message: "Validation failed",
					errors: errors.array(),
				});
				return;
			}

			const { message, jobId, clientId } = req.body;

			if (!clientId) {
				res.status(400).json({
					success: false,
					message: "Client ID is required",
				});
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(clientId)) {
				res.status(400).json({
					success: false,
					message: "Invalid client ID",
				});
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(jobId)) {
				res.status(400).json({
					success: false,
					message: "Invalid job ID",
				});
				return;
			}

			// Verify the job exists and belongs to the client
			const job = await pdfPrintModel.findById(jobId).populate("adminId");
			if (!job) {
				res.status(404).json({
					success: false,
					message: "Job not found",
				});
				return;
			}

			// Verify client exists
			const client = await Client.findById(clientId);
			if (!client) {
				res.status(404).json({
					success: false,
					message: "Client not found",
				});
				return;
			}

			// Verify the job belongs to the client
			if (job.clientId.toString() !== clientId) {
				res.status(403).json({
					success: false,
					message: "Job does not belong to the specified client",
				});
				return;
			}

			// Create support ticket
			const supportTicket = new supportModel({
				message,
				clientId: new mongoose.Types.ObjectId(clientId),
				adminId: job.adminId,
				jobId: job._id,
			});

			await supportTicket.save();

			// Populate references
			await supportTicket.populate("clientId");
			await supportTicket.populate("adminId");
			await supportTicket.populate("jobId");

			res.status(201).json({
				success: true,
				message: "Support ticket created successfully",
				data: { supportTicket },
			});
		} catch (error: any) {
			console.error("Create support ticket error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get all support tickets
	 * @route GET /api/support
	 * @access Admin/Clerk (filtered by adminId) or Client (their own tickets)
	 */
	static async getSupportTickets(req: Request, res: Response): Promise<void> {
		try {
			const user = (req as any).user;
			const authenticatedClientId = (req as any).client?.clientId;

			let filter: Record<string, any> = {};

			if (user) {
				// Admin/Clerk access - filter by adminId
				const adminIdFilter = await SupportController.buildAdminIdFilter(user);
				filter = { ...adminIdFilter };
			} else if (authenticatedClientId) {
				// Client access - only their own tickets
				filter.clientId = new mongoose.Types.ObjectId(authenticatedClientId);
			} else {
				res.status(401).json({
					success: false,
					message: "Authentication required",
				});
				return;
			}

			// Optional query parameters
			const { jobId: queryJobId, clientId: queryClientId, status } = req.query;

			if (queryJobId && mongoose.Types.ObjectId.isValid(queryJobId as string)) {
				filter.jobId = new mongoose.Types.ObjectId(queryJobId as string);
			}

			if (queryClientId && mongoose.Types.ObjectId.isValid(queryClientId as string)) {
				// Only allow admins/clerks to filter by clientId
				if (user) {
					filter.clientId = new mongoose.Types.ObjectId(queryClientId as string);
				}
			}

			const supportTickets = await supportModel
				.find(filter)
				.populate("clientId", "fullName email phoneNumber")
				.populate("adminId", "name email businessName")
				.populate("jobId", "status printerName createdAt")
				.sort({ createdAt: -1 });

				console.log("supportTickets -----", supportTickets);

			res.json({
				success: true,
				data: { supportTickets },
				count: supportTickets.length,
			});
		} catch (error: any) {
			console.error("Get support tickets error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get support ticket by ID
	 * @route GET /api/support/:id
	 * @access Admin/Clerk (for their admin) or Client (their own ticket)
	 */
	static async getSupportTicketById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const user = (req as any).user;
			const clientId = (req as any).client?.clientId;

			const supportTicket = await supportModel
				.findById(id)
				.populate("clientId", "fullName email phoneNumber")
				.populate("adminId", "name email businessName")
				.populate("jobId");

			if (!supportTicket) {
				res.status(404).json({
					success: false,
					message: "Support ticket not found",
				});
				return;
			}

			// Check access permissions
			if (user) {
				// Admin/Clerk - check if ticket belongs to their admin
				const adminIdFilter = await SupportController.buildAdminIdFilter(user);
				if (supportTicket.adminId.toString() !== adminIdFilter.adminId?.toString()) {
					res.status(403).json({
						success: false,
						message: "Access denied",
					});
					return;
				}
			} else if (clientId) {
				// Client - check if ticket belongs to them
				if (supportTicket.clientId.toString() !== clientId) {
					res.status(403).json({
						success: false,
						message: "Access denied",
					});
					return;
				}
			} else {
				res.status(401).json({
					success: false,
					message: "Authentication required",
				});
				return;
			}

			res.json({
				success: true,
				data: { supportTicket },
			});
		} catch (error: any) {
			console.error("Get support ticket by ID error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get support tickets for a specific job
	 * @route GET /api/support/job/:jobId
	 * @access Admin/Clerk (for their admin) or Client (their own job)
	 */
	static async getSupportTicketsByJob(req: Request, res: Response): Promise<void> {
		try {
			const { jobId } = req.params;
			const user = (req as any).user;
			const clientId = (req as any).client?.clientId;

			if (!jobId) {
				res.status(400).json({
					success: false,
					message: "Job ID is required",
				});
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(jobId as string)) {
				res.status(400).json({
					success: false,
					message: "Invalid job ID",
				});
				return;
			}

			// Verify job exists and check access
			const job = await pdfPrintModel.findById(jobId);
			if (!job) {
				res.status(404).json({
					success: false,
					message: "Job not found",
				});
				return;
			}

			let filter: Record<string, any> = { jobId: new mongoose.Types.ObjectId(jobId as string) };

			if (user) {
				// Admin/Clerk - check if job belongs to their admin
				const adminIdFilter = await SupportController.buildAdminIdFilter(user);
				if (job.adminId.toString() !== adminIdFilter.adminId?.toString()) {
					res.status(403).json({
						success: false,
						message: "Access denied",
					});
					return;
				}
				filter.adminId = adminIdFilter.adminId;
			} else if (clientId) {
				// Client - check if job belongs to them
				if (job.clientId.toString() !== clientId) {
					res.status(403).json({
						success: false,
						message: "Access denied",
					});
					return;
				}
				filter.clientId = new mongoose.Types.ObjectId(clientId as string);
			} else {
				res.status(401).json({
					success: false,
					message: "Authentication required",
				});
				return;
			}

			const supportTickets = await supportModel
				.find(filter)
				.populate("clientId", "fullName email phoneNumber")
				.populate("adminId", "name email businessName")
				.sort({ createdAt: -1 });

			res.json({
				success: true,
				data: { supportTickets },
				count: supportTickets.length,
			});
		} catch (error: any) {
			console.error("Get support tickets by job error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get support tickets for a specific client
	 * @route GET /api/support/client/:clientId
	 * @access Admin/Clerk (for their admin) or Client (their own tickets)
	 */
	static async getSupportTicketsByClient(req: Request, res: Response): Promise<void> {
		try {
			const { clientId: paramClientId } = req.params;
			const user = (req as any).user;
			const authenticatedClientId = (req as any).client?.clientId;

			if (!paramClientId) {
				res.status(400).json({
					success: false,
					message: "Client ID is required",
				});
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(paramClientId as string)) {
				res.status(400).json({
					success: false,
					message: "Invalid client ID",
				});
				return;
			}

			let filter: Record<string, any> = { clientId: new mongoose.Types.ObjectId(paramClientId) };

			if (user) {
				// Admin/Clerk - filter by adminId
				const adminIdFilter = await SupportController.buildAdminIdFilter(user);
				filter.adminId = adminIdFilter.adminId;
			} else if (authenticatedClientId) {
				// Client - only their own tickets
				if (paramClientId !== authenticatedClientId) {
					res.status(403).json({
						success: false,
						message: "Access denied",
					});
					return;
				}
			} else {
				res.status(401).json({
					success: false,
					message: "Authentication required",
				});
				return;
			}

			const supportTickets = await supportModel
				.find(filter)
				.populate("clientId", "fullName email phoneNumber")
				.populate("adminId", "name email businessName")
				.populate("jobId", "status printerName createdAt")
				.sort({ createdAt: -1 });

			res.json({
				success: true,
				data: { supportTickets },
				count: supportTickets.length,
			});
		} catch (error: any) {
			console.error("Get support tickets by client error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Update support ticket (e.g., add response)
	 * @route PUT /api/support/:id
	 * @access Admin/Clerk only
	 */
	static async updateSupportTicket(req: Request, res: Response): Promise<void> {
		try {
			// Check for validation errors
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({
					success: false,
					message: "Validation failed",
					errors: errors.array(),
				});
				return;
			}

			const { id } = req.params;
			const { message, response } = req.body;
			const user = (req as any).user;

			if (!user) {
				res.status(401).json({
					success: false,
					message: "Admin/Clerk authentication required",
				});
				return;
			}

			// Get the support ticket
			const supportTicket = await supportModel.findById(id);
			if (!supportTicket) {
				res.status(404).json({
					success: false,
					message: "Support ticket not found",
				});
				return;
			}

			// Check access permissions
			const adminIdFilter = await SupportController.buildAdminIdFilter(user);
			if (supportTicket.adminId.toString() !== adminIdFilter.adminId?.toString()) {
				res.status(403).json({
					success: false,
					message: "Access denied",
				});
				return;
			}

			// Update ticket
			const updateData: Record<string, any> = {};
			if (message) updateData.message = message;
			if (response) updateData.response = response;

			const updatedTicket = await supportModel
				.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
				.populate("clientId", "fullName email phoneNumber")
				.populate("adminId", "name email businessName")
				.populate("jobId");

			res.json({
				success: true,
				message: "Support ticket updated successfully",
				data: { supportTicket: updatedTicket },
			});
		} catch (error: any) {
			console.error("Update support ticket error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Delete support ticket
	 * @route DELETE /api/support/:id
	 * @access Admin/Clerk only
	 */
	static async deleteSupportTicket(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const user = (req as any).user;

			if (!user) {
				res.status(401).json({
					success: false,
					message: "Admin/Clerk authentication required",
				});
				return;
			}

			// Get the support ticket
			const supportTicket = await supportModel.findById(id);
			if (!supportTicket) {
				res.status(404).json({
					success: false,
					message: "Support ticket not found",
				});
				return;
			}

			// Check access permissions
			const adminIdFilter = await SupportController.buildAdminIdFilter(user);
			if (supportTicket.adminId.toString() !== adminIdFilter.adminId?.toString()) {
				res.status(403).json({
					success: false,
					message: "Access denied",
				});
				return;
			}

			await supportModel.findByIdAndDelete(id);

			res.json({
				success: true,
				message: "Support ticket deleted successfully",
			});
		} catch (error: any) {
			console.error("Delete support ticket error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}
}

