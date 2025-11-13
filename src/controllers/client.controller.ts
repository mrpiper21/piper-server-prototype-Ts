import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Client from '../models/client.model.js';
import jwt from 'jsonwebtoken';
import pdfPrintModel from '../models/printer.model.js';
import mongoose from 'mongoose';
import User from "../models/user.model.js";

export class ClientController {
	/**
	 * Register a new client
	 */
	static async register(req: Request, res: Response): Promise<void> {
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

			const { email, password, fullName, phoneNumber } = req.body;

			// Check if client already exists
			const existingClient = await Client.findOne({ email });
			if (existingClient) {
				res.status(409).json({
					success: false,
					message: "Client with this email already exists",
				});
				return;
			}

			// Create new client
			const client = new Client({
				email,
				password,
				fullName,
				phoneNumber,
				isActive: true,
			});

			await client.save();

			// Generate token (custom implementation since client model has issues with generateAuthToken)
			const token = ClientController.generateToken(client);

			res.status(201).json({
				success: true,
				message: "Client registered successfully",
				data: {
					client: {
						_id: client._id,
						email: client.email,
						fullName: client.fullName,
						phoneNumber: client.phoneNumber,
						isActive: client.isActive,
						createdAt: client.createdAt,
						updatedAt: client.updatedAt,
					},
					token,
				},
			});
		} catch (error: any) {
			console.error("Client registration error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error during registration",
				error: error.message,
			});
		}
	}

	/**
	 * Login client
	 */
	static async login(req: Request, res: Response): Promise<void> {
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

			const { email, password } = req.body;

			// Find client with password using the static method
			const client = await Client.findOne({ email }).select("+password");
			if (!client) {
				res.status(401).json({
					success: false,
					message: "Something went wrong",
				});
				return;
			}

			// Check password
			const isPasswordValid = await client.comparePassword(password);
			if (!isPasswordValid) {
				res.status(401).json({
					success: false,
					message: "Invalid email or password",
				});
				return;
			}

			// Update last login
			client.lastLogin = new Date();
			await client.save();

			// Generate token
			const token = ClientController.generateToken(client);

			res.json({
				success: true,
				message: "Login successful",
				data: {
					client: {
						_id: client._id,
						email: client.email,
						fullName: client.fullName,
						phoneNumber: client.phoneNumber,
						isActive: client.isActive,
						lastLogin: client.lastLogin,
						createdAt: client.createdAt,
						updatedAt: client.updatedAt,
					},
					token,
				},
			});
		} catch (error: any) {
			console.error("Client login error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error during login",
				error: error.message,
			});
		}
	}

	/**
	 * Get current client profile
	 */
	static async getProfile(req: Request, res: Response): Promise<void> {
		try {
			const clientId = (req as any).client?.clientId;
			if (!clientId) {
				res.status(401).json({
					success: false,
					message: "Authentication required",
				});
				return;
			}

			const client = await Client.findById(clientId);
			if (!client || !client.isActive) {
				res.status(404).json({
					success: false,
					message: "Client not found",
				});
				return;
			}

			res.json({
				success: true,
				data: {
					client: {
						_id: client._id,
						email: client.email,
						fullName: client.fullName,
						phoneNumber: client.phoneNumber,
						isActive: client.isActive,
						lastLogin: client.lastLogin,
						createdAt: client.createdAt,
						updatedAt: client.updatedAt,
					},
				},
			});
		} catch (error: any) {
			console.error("Get client profile error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Update client profile
	 */
	static async updateProfile(req: Request, res: Response): Promise<void> {
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

			const { fullName, email, phoneNumber } = req.body;
			const clientId = (req as any).client?.clientId;

			const client = await Client.findById(clientId);
			if (!client || !client.isActive) {
				res.status(404).json({
					success: false,
					message: "Client not found",
				});
				return;
			}

			// Check if email is being changed and if it's already taken
			if (email && email !== client.email) {
				const existingClient = await Client.findOne({ email });
				if (existingClient) {
					res.status(409).json({
						success: false,
						message: "Email already in use",
					});
					return;
				}
				client.email = email;
			}

			if (fullName) {
				client.fullName = fullName;
			}

			if (phoneNumber) {
				client.phoneNumber = phoneNumber;
			}

			await client.save();

			res.json({
				success: true,
				message: "Profile updated successfully",
				data: {
					client: {
						_id: client._id,
						email: client.email,
						fullName: client.fullName,
						phoneNumber: client.phoneNumber,
						isActive: client.isActive,
						lastLogin: client.lastLogin,
						createdAt: client.createdAt,
						updatedAt: client.updatedAt,
					},
				},
			});
		} catch (error: any) {
			console.error("Update client profile error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Change client password
	 */
	static async changePassword(req: Request, res: Response): Promise<void> {
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

			const { currentPassword, newPassword } = req.body;
			const clientId = (req as any).client?.clientId;

			const client = await Client.findById(clientId).select("+password");
			if (!client || !client.isActive) {
				res.status(404).json({
					success: false,
					message: "Client not found",
				});
				return;
			}

			// Verify current password
			const isCurrentPasswordValid = await client.comparePassword(
				currentPassword
			);
			if (!isCurrentPasswordValid) {
				res.status(400).json({
					success: false,
					message: "Current password is incorrect",
				});
				return;
			}

			// Update password
			client.password = newPassword;
			await client.save();

			res.json({
				success: true,
				message: "Password changed successfully",
			});
		} catch (error: any) {
			console.error("Change client password error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get all clients (Admin/Staff only)
	 */
	static async getAllClients(req: Request, res: Response): Promise<void> {
		try {
			const { isActive, page = "1", limit = "10", search } = req.query;

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

			// Get total count
			const total = await Client.countDocuments(query);

			res.json({
				success: true,
				data: {
					clients,
					pagination: {
						current: Number(page),
						pages: Math.ceil(total / Number(limit)),
						total,
						limit: Number(limit),
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
	 * Get client by ID
	 */
	static async getClientById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const client = await Client.findById(id).select("-password");
			if (!client) {
				res.status(404).json({
					success: false,
					message: "Client not found",
				});
				return;
			}

			res.json({
				success: true,
				data: { client },
			});
		} catch (error: any) {
			console.error("Get client by ID error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Update client (Admin/Staff only)
	 */
	static async updateClient(req: Request, res: Response): Promise<void> {
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
			const { email, fullName, phoneNumber, isActive } = req.body;

			const client = await Client.findById(id);
			if (!client) {
				res.status(404).json({
					success: false,
					message: "Client not found",
				});
				return;
			}

			// Check if email is being changed and if it's already taken
			if (email && email !== client.email) {
				const existingClient = await Client.findOne({ email });
				if (existingClient) {
					res.status(409).json({
						success: false,
						message: "Email already in use",
					});
					return;
				}
				client.email = email;
			}

			if (fullName) client.fullName = fullName;
			if (phoneNumber) client.phoneNumber = phoneNumber;
			if (isActive !== undefined) client.isActive = isActive;

			await client.save();

			res.json({
				success: true,
				message: "Client updated successfully",
				data: {
					client: {
						_id: client._id,
						email: client.email,
						fullName: client.fullName,
						phoneNumber: client.phoneNumber,
						isActive: client.isActive,
						lastLogin: client.lastLogin,
						createdAt: client.createdAt,
						updatedAt: client.updatedAt,
					},
				},
			});
		} catch (error: any) {
			console.error("Update client error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Delete client (Admin/Staff only) - Soft delete
	 */
	static async deleteClient(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const client = await Client.findById(id);
			if (!client) {
				res.status(404).json({
					success: false,
					message: "Client not found",
				});
				return;
			}

			// Soft delete - set isActive to false
			client.isActive = false;
			await client.save();

			res.json({
				success: true,
				message: "Client deactivated successfully",
			});
		} catch (error: any) {
			console.error("Delete client error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get client statistics
	 */
	static async getClientStats(req: Request, res: Response): Promise<void> {
		try {
			const totalClients = await Client.countDocuments({ isActive: true });
			const inactiveClients = await Client.countDocuments({ isActive: false });

			const recentClients = await Client.find({ isActive: true })
				.select("-password")
				.sort({ createdAt: -1 })
				.limit(5);

			res.json({
				success: true,
				data: {
					totalClients,
					inactiveClients,
					activeClients: totalClients,
					recentClients,
				},
			});
		} catch (error: any) {
			console.error("Get client stats error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	static async getClientOrders(req: Request, res: Response): Promise<void> {
		try {
			const clientId = req.params.id;
			const orders = await pdfPrintModel.find({ clientId: clientId });

			console.log("orders ------- ", orders);

			res.json({
				success: true,
				data: {
					orders,
				},
			});
		} catch (error: any) {
			console.error("Get client stats error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Generate JWT token for client (helper method)
	 */
	static generateToken(client: any): string {
		const payload = {
			clientId: client._id.toString(),
			email: client.email,
			type: "client",
		};

		const secret = process.env.JWT_SECRET || "fallback-secret";
		return jwt.sign(payload, secret, {
			expiresIn: process.env.JWT_EXPIRE || "7d",
		} as jwt.SignOptions);
	}

	/**
	 * Verify client token middleware
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

			const secret = process.env.JWT_SECRET || "fallback-secret";
			const decoded = jwt.verify(token, secret) as any;

			// Check if token is for a client
			if (decoded.type !== "client") {
				res.status(403).json({
					success: false,
					message: "Invalid token type",
				});
				return;
			}

			(req as any).client = decoded;
			next();
		} catch (error) {
			res.status(403).json({
				success: false,
				message: "Invalid or expired token",
			});
		}
	};

	public static async getAllPrintStations(req: Request, res: Response): Promise<void> {
		try {
			// Get only active admins (print stations) with only name, location, and email
			const printStations = await User.find({ isActive: true })
				.select("name email location")
				.sort({ name: 1 });

			res.json({
				success: true,
				data: { printStations },
			});
		} catch (error: any) {
			console.error("Get all print stations error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	}
}
