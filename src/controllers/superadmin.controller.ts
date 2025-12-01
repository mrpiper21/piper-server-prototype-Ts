import type { Request, Response } from 'express';
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import SuperAdmin from "../models/superadmin.model.js";
import User from "../models/user.model.js";
import Clerk from "../models/clerk.model.js";
import Client from "../models/client.model.js";
import supportModel from "../models/support.model.js";
import pdfPrintModel from "../models/printer.model.js";
import { UserRole } from "../models/shared/enums.js";
import mongoose from "mongoose";
import brevo from "../config/brevoConfig.js";
import {
	generateBusinessPaymentSetupEmail,
	generateBusinessPaymentSetupEmailText,
} from "../utils/emailTemplates.js";

export class SuperAdminController {
	/**
	 * Register a new superadmin
	 * @route POST /api/superadmin/register
	 * @access Public (should be protected in production)
	 */
	static async register(req: Request, res: Response): Promise<void> {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({
					success: false,
					message: "Validation failed",
					errors: errors.array(),
				});
				return;
			}

			const { email, password, name } = req.body;

			// Check if superadmin already exists
			const existingSuperAdmin = await SuperAdmin.findOne({ email });
			if (existingSuperAdmin) {
				res.status(409).json({
					success: false,
					message: "SuperAdmin with this email already exists",
				});
				return;
			}

			// Create new superadmin
			const superAdmin = new SuperAdmin({
				email,
				password,
				name,
			});

			await superAdmin.save();

			// Generate token
			const token = superAdmin.generateAuthToken();

			res.status(201).json({
				success: true,
				message: "SuperAdmin registered successfully",
				data: {
					superAdmin: superAdmin.toJSON(),
					token,
				},
			});
		} catch (error: any) {
			console.error("SuperAdmin registration error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Login superadmin
	 * @route POST /api/superadmin/login
	 * @access Public
	 */
	static async login(req: Request, res: Response): Promise<void> {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({
					success: false,
					message: "Validation failed",
					errors: errors.array(),
				});
				return;
			}

			const { email, password } = req.body;

			// Find superadmin with password
			const superAdmin = await SuperAdmin.findByEmailWithPassword(email);
			if (!superAdmin || !superAdmin.isActive) {
				res.status(401).json({
					success: false,
					message: "Invalid credentials",
				});
				return;
			}

			// Check password
			const isPasswordValid = await superAdmin.comparePassword(password);
			if (!isPasswordValid) {
				res.status(401).json({
					success: false,
					message: "Invalid credentials",
				});
				return;
			}

			// Update last login
			superAdmin.lastLogin = new Date();
			await superAdmin.save();

			// Generate token
			const token = superAdmin.generateAuthToken();

			res.json({
				success: true,
				message: "Login successful",
				data: {
					superAdmin: superAdmin.toJSON(),
					token,
				},
			});
		} catch (error: any) {
			console.error("SuperAdmin login error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Verify superadmin token middleware
	 */
	static verifyToken = (req: Request, res: Response, next: any): void => {
		try {
			const authHeader = req.headers.authorization;
			const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

			if (!token) {
				res.status(401).json({
					success: false,
					message: "Access token required",
				});
				return;
			}

			const decoded = jwt.verify(
				token,
				process.env.JWT_SECRET || "fallback-secret"
			) as any;

			// Check if token is for a superadmin
			if (decoded.role !== UserRole.SUPERADMIN || !decoded.superAdminId) {
				res.status(403).json({
					success: false,
					message: "SuperAdmin access required",
				});
				return;
			}

			(req as any).superAdmin = {
				superAdminId: decoded.superAdminId,
				email: decoded.email,
				role: decoded.role,
				permissions: decoded.permissions,
			};
			next();
		} catch (error) {
			res.status(403).json({
				success: false,
				message: "Invalid or expired token",
			});
		}
	};

	/**
	 * Get all users (admins)
	 * @route GET /api/superadmin/users
	 * @access SuperAdmin only
	 */
	static async getAllUsers(req: Request, res: Response): Promise<void> {
		try {
			const { role, isActive, page = 1, limit = 10, search } = req.query;

			// Build query
			const query: any = {};

			if (role) {
				query.role = role;
			}

			if (isActive !== undefined) {
				query.isActive = isActive === "true";
			}

			if (search) {
				query.$or = [
					{ name: { $regex: search, $options: "i" } },
					{ email: { $regex: search, $options: "i" } },
					{ businessName: { $regex: search, $options: "i" } },
				];
			}

			// Calculate pagination
			const skip = (Number(page) - 1) * Number(limit);

			// Get users with pagination
			const users = await User.find(query)
				.select("-password")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit));

			const total = await User.countDocuments(query);

			res.json({
				success: true,
				data: {
					users,
					pagination: {
						currentPage: Number(page),
						totalPages: Math.ceil(total / Number(limit)),
						totalItems: total,
						itemsPerPage: Number(limit),
					},
				},
			});
		} catch (error: any) {
			console.error("Get all users error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get all clerks
	 * @route GET /api/superadmin/clerks
	 * @access SuperAdmin only
	 */
	static async getAllClerks(req: Request, res: Response): Promise<void> {
		try {
			const { isActive, page = 1, limit = 10, search, adminId } = req.query;

			// Build query
			const query: any = {};

			if (isActive !== undefined) {
				query.isActive = isActive === "true";
			}

			if (adminId && mongoose.Types.ObjectId.isValid(adminId as string)) {
				query.adminId = new mongoose.Types.ObjectId(adminId as string);
			}

			if (search) {
				query.$or = [
					{ name: { $regex: search, $options: "i" } },
					{ email: { $regex: search, $options: "i" } },
				];
			}

			// Calculate pagination
			const skip = (Number(page) - 1) * Number(limit);

			// Get clerks with pagination
			const clerks = await Clerk.find(query)
				.select("-password")
				.populate("adminId", "name email businessName")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit));

			const total = await Clerk.countDocuments(query);

			res.json({
				success: true,
				data: {
					clerks,
					pagination: {
						currentPage: Number(page),
						totalPages: Math.ceil(total / Number(limit)),
						totalItems: total,
						itemsPerPage: Number(limit),
					},
				},
			});
		} catch (error: any) {
			console.error("Get all clerks error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get all clients
	 * @route GET /api/superadmin/clients
	 * @access SuperAdmin only
	 */
	static async getAllClients(req: Request, res: Response): Promise<void> {
		try {
			const { isActive, page = 1, limit = 10, search } = req.query;

			// Build query
			const query: any = {};

			if (isActive !== undefined) {
				query.isActive = isActive === "true";
			}

			if (search) {
				query.$or = [
					{ fullName: { $regex: search, $options: "i" } },
					{ email: { $regex: search, $options: "i" } },
					{ phoneNumber: { $regex: search, $options: "i" } },
				];
			}

			// Calculate pagination
			const skip = (Number(page) - 1) * Number(limit);

			// Get clients with pagination
			const clients = await Client.find(query)
				.select("-password")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit));

			const total = await Client.countDocuments(query);

			res.json({
				success: true,
				data: {
					clients,
					pagination: {
						currentPage: Number(page),
						totalPages: Math.ceil(total / Number(limit)),
						totalItems: total,
						itemsPerPage: Number(limit),
					},
				},
			});
		} catch (error: any) {
			console.error("Get all clients error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get user by ID
	 * @route GET /api/superadmin/users/:id
	 * @access SuperAdmin only
	 */
	static async getUserById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			if (!id) {
				res.status(400).json({
					success: false,
					message: "User ID is required",
				});
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({
					success: false,
					message: "Invalid user ID",
				});
				return;
			}

			const user = await User.findById(id).select("-password");
			if (!user) {
				res.status(404).json({
					success: false,
					message: "User not found",
				});
				return;
			}

			res.json({
				success: true,
				data: { user },
			});
		} catch (error: any) {
			console.error("Get user by ID error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Update user
	 * @route PUT /api/superadmin/users/:id
	 * @access SuperAdmin only
	 */
	static async updateUser(req: Request, res: Response): Promise<void> {
		try {
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
			const { name, email, isActive, businessName, businessPhone } = req.body;

			if (!id) {
				res.status(400).json({
					success: false,
					message: "User ID is required",
				});
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({
					success: false,
					message: "Invalid user ID",
				});
				return;
			}

			const updateData: Record<string, any> = {};
			if (name) updateData.name = name;
			if (email) updateData.email = email;
			if (isActive !== undefined) updateData.isActive = isActive;
			if (businessName) updateData.businessName = businessName;
			if (businessPhone) updateData.businessPhone = businessPhone;

			const user = await User.findByIdAndUpdate(
				id,
				updateData,
				{ new: true, runValidators: true }
			).select("-password");

			if (!user) {
				res.status(404).json({
					success: false,
					message: "User not found",
				});
				return;
			}

			res.json({
				success: true,
				message: "User updated successfully",
				data: { user },
			});
		} catch (error: any) {
			console.error("Update user error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Delete user (deactivate)
	 * @route DELETE /api/superadmin/users/:id
	 * @access SuperAdmin only
	 */
	static async deleteUser(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			if (!id) {
				res.status(400).json({
					success: false,
					message: "User ID is required",
				});
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({
					success: false,
					message: "Invalid user ID",
				});
				return;
			}

			const user = await User.findByIdAndUpdate(
				id,
				{ isActive: false },
				{ new: true }
			).select("-password");

			if (!user) {
				res.status(404).json({
					success: false,
					message: "User not found",
				});
				return;
			}

			res.json({
				success: true,
				message: "User deactivated successfully",
				data: { user },
			});
		} catch (error: any) {
			console.error("Delete user error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get all support tickets
	 * @route GET /api/superadmin/support
	 * @access SuperAdmin only
	 */
	static async getAllSupportTickets(req: Request, res: Response): Promise<void> {
		try {
			const { page = 1, limit = 10, adminId, clientId, jobId, status } = req.query;

			// Build query
			const query: any = {};

			if (adminId && mongoose.Types.ObjectId.isValid(adminId as string)) {
				query.adminId = new mongoose.Types.ObjectId(adminId as string);
			}

			if (clientId && mongoose.Types.ObjectId.isValid(clientId as string)) {
				query.clientId = new mongoose.Types.ObjectId(clientId as string);
			}

			if (jobId && mongoose.Types.ObjectId.isValid(jobId as string)) {
				query.jobId = new mongoose.Types.ObjectId(jobId as string);
			}

			// Calculate pagination
			const skip = (Number(page) - 1) * Number(limit);

			// Get support tickets with pagination
			const supportTickets = await supportModel
				.find(query)
				.populate("clientId", "fullName email phoneNumber")
				.populate("adminId", "name email businessName")
				.populate("jobId", "status printerName createdAt")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit));

				console.log("supportTickets -----", supportTickets);

			const total = await supportModel.countDocuments(query);

			res.json({
				success: true,
				data: {
					supportTickets,
					pagination: {
						currentPage: Number(page),
						totalPages: Math.ceil(total / Number(limit)),
						totalItems: total,
						itemsPerPage: Number(limit),
					},
				},
			});
		} catch (error: any) {
			console.error("Get all support tickets error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get support ticket by ID
	 * @route GET /api/superadmin/support/:id
	 * @access SuperAdmin only
	 */
	static async getSupportTicketById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			if (!id) {
				res.status(400).json({
					success: false,
					message: "Support ticket ID is required",
				});
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({
					success: false,
					message: "Invalid support ticket ID",
				});
				return;
			}

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
	 * Update support ticket
	 * @route PUT /api/superadmin/support/:id
	 * @access SuperAdmin only
	 */
	static async updateSupportTicket(req: Request, res: Response): Promise<void> {
		try {
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

			if (!id) {
				res.status(400).json({
					success: false,
					message: "Support ticket ID is required",
				});
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({
					success: false,
					message: "Invalid support ticket ID",
				});
				return;
			}

			const updateData: Record<string, any> = {};
			if (message) updateData.message = message;
			if (response) updateData.response = response;

			const supportTicket = await supportModel
				.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
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

			res.json({
				success: true,
				message: "Support ticket updated successfully",
				data: { supportTicket },
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
	 * @route DELETE /api/superadmin/support/:id
	 * @access SuperAdmin only
	 */
	static async deleteSupportTicket(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			if (!id) {
				res.status(400).json({
					success: false,
					message: "Support ticket ID is required",
				});
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({
					success: false,
					message: "Invalid support ticket ID",
				});
				return;
			}

			const supportTicket = await supportModel.findByIdAndDelete(id);

			if (!supportTicket) {
				res.status(404).json({
					success: false,
					message: "Support ticket not found",
				});
				return;
			}

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

	/**
	 * Get dashboard statistics
	 * @route GET /api/superadmin/stats
	 * @access SuperAdmin only
	 */
	static async getDashboardStats(req: Request, res: Response): Promise<void> {
		try {
			const [
				totalUsers,
				activeUsers,
				totalClerks,
				activeClerks,
				totalClients,
				activeClients,
				totalSupportTickets,
				totalPrintJobs,
				pendingPrintJobs,
				completedPrintJobs,
			] = await Promise.all([
				User.countDocuments(),
				User.countDocuments({ isActive: true }),
				Clerk.countDocuments(),
				Clerk.countDocuments({ isActive: true }),
				Client.countDocuments(),
				Client.countDocuments({ isActive: true }),
				supportModel.countDocuments(),
				pdfPrintModel.countDocuments(),
				pdfPrintModel.countDocuments({ status: "pending" }),
				pdfPrintModel.countDocuments({ status: "completed" }),
			]);

			res.json({
				success: true,
				data: {
					users: {
						total: totalUsers,
						active: activeUsers,
						inactive: totalUsers - activeUsers,
					},
					clerks: {
						total: totalClerks,
						active: activeClerks,
						inactive: totalClerks - activeClerks,
					},
					clients: {
						total: totalClients,
						active: activeClients,
						inactive: totalClients - activeClients,
					},
					supportTickets: {
						total: totalSupportTickets,
					},
					printJobs: {
						total: totalPrintJobs,
						pending: pendingPrintJobs,
						completed: completedPrintJobs,
					},
				},
			});
		} catch (error: any) {
			console.error("Get dashboard stats error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

    static async setUpBussinessSubaccount(req: Request, res: Response): Promise<void> {
        
        try {
            const userId = req.params.userId;
            const { paystackSubaccountCode } = req.body;
            const admin = await User.findById(userId);
            if (!admin) {
                res.status(404).json({
                    success: false,
                    message: "Admin not found",
                });
                return;
            }
            admin.paystackSubaccountCode = paystackSubaccountCode;
            await admin.save();

            // Send email notification
            try {
                const emailHtml = generateBusinessPaymentSetupEmail({
                    adminName: admin.name,
                    businessName: admin.businessName,
                    email: admin.email,
                    paystackSubaccountCode: paystackSubaccountCode,
                });

                const emailText = generateBusinessPaymentSetupEmailText({
                    adminName: admin.name,
                    businessName: admin.businessName,
                    email: admin.email,
                    paystackSubaccountCode: paystackSubaccountCode,
                });

                const emailResult = await brevo.emails.send({
                    from: process.env.BREVO_SENDER_EMAIL || "noreply@example.com",
                    to: admin.email,
                    subject: "Payment System Setup Complete - Your Business is Ready!",
                    html: emailHtml,
                    text: emailText,
                });

                if (emailResult.error) {
                    console.error("Failed to send payment setup email:", emailResult.error);
                } else {
                    console.log("Payment setup email sent successfully:", emailResult.data?.messageId);
                }
            } catch (emailError: any) {
                console.error("Error sending payment setup email:", emailError);
                // Don't fail the request if email fails
            }

            res.json({
                success: true,
                message: "Business subaccount set up successfully",
                data: { admin },
            });
        } catch (error: any) {
            console.error("Set up business subaccount error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }
}
