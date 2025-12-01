import { type Request, type Response } from "express";
import { validationResult } from "express-validator";
import { paystackApi, isPaystackConfigured } from "../config/paystackConfig.js";
import User from "../models/user.model.js";
import pdfPrintModel from "../models/printer.model.js";
import mongoose from "mongoose";

export class PaymentController {
	/**
	 * Initialize Paystack payment
	 * @route POST /api/payments/initialize
	 * @access Client (authenticated)
	 */
	static async initializePayment(req: Request, res: Response): Promise<void> {
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

			if (!isPaystackConfigured()) {
				res.status(500).json({
					success: false,
					message: "Payment service is not configured",
				});
				return;
			}

			const { amount, email, subaccount, split_code, metadata, callback_url, currency } = req.body;

			// Validate required fields
			if (!amount || !email) {
				res.status(400).json({
					success: false,
					message: "Amount and email are required",
				});
				return;
			}

			const transactionData: any = {
				amount: Number(amount) * 100, 
				email,
				currency: currency || "GHS", // Default to GHS for Ghana
			};

			// Add subaccount if provided (direct subaccount payment)
			if (subaccount) {
				transactionData.subaccount = subaccount;
			}

			// Add split code if provided (split payment)
			if (split_code) {
				transactionData.split_code = split_code;
			}

			// Add metadata if provided
			if (metadata) {
				transactionData.metadata = metadata;
			}

			// Add callback URL if provided
			if (callback_url) {
				transactionData.callback_url = callback_url;
			}

			// Initialize transaction with Paystack
			const response = await paystackApi.post("/transaction/initialize", transactionData);

			if (response.data.status) {
				res.status(200).json({
					status: true,
					message: "Payment initialized successfully",
					data: {
						authorization_url: response.data.data.authorization_url,
						access_code: response.data.data.access_code,
						reference: response.data.data.reference,
					},
				});
			} else {
				res.status(400).json({
					status: false,
					message: response.data.message || "Failed to initialize payment",
				});
			}
		} catch (error: any) {
			console.error("Initialize payment error:", error);
			res.status(500).json({
				status: false,
				message: error.response?.data?.message || "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Create Paystack split payment configuration
	 * @route POST /api/payments/split/create
	 * @access Admin (authenticated)
	 */
	static async createSplit(req: Request, res: Response): Promise<void> {
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

			if (!isPaystackConfigured()) {
				res.status(500).json({
					success: false,
					message: "Payment service is not configured",
				});
				return;
			}

			const { name, type, currency, subaccounts } = req.body;

			// Validate required fields
			if (!name || !type || !currency || !subaccounts || !Array.isArray(subaccounts)) {
				res.status(400).json({
					status: false,
					message: "Name, type, currency, and subaccounts array are required",
				});
				return;
			}

			// Validate split type
			if (!["percentage", "flat"].includes(type)) {
				res.status(400).json({
					status: false,
					message: "Split type must be 'percentage' or 'flat'",
				});
				return;
			}

			// Validate subaccounts array
			if (subaccounts.length === 0) {
				res.status(400).json({
					status: false,
					message: "At least one subaccount is required",
				});
				return;
			}

			// Prepare split data for Paystack
			const splitData: any = {
				name,
				type,
				currency: currency.toUpperCase(), // Ensure uppercase (NGN, GHS)
				subaccounts: subaccounts.map((sub: any) => ({
					subaccount: sub.subaccount,
					share: Number(sub.share),
				})),
			};

			// Create split with Paystack
			const response = await paystackApi.post("/split", splitData);

			if (response.data.status) {
				res.status(200).json({
					status: true,
					message: "Split created successfully",
					data: {
						id: response.data.data.id,
						name: response.data.data.name,
						type: response.data.data.type,
						currency: response.data.data.currency,
						integration: response.data.data.integration,
						domain: response.data.data.domain,
						split_code: response.data.data.split_code,
						active: response.data.data.active,
						owner: response.data.data.owner,
						subaccounts: response.data.data.subaccounts,
						createdAt: response.data.data.createdAt,
						updatedAt: response.data.data.updatedAt,
					},
				});
			} else {
				res.status(400).json({
					status: false,
					message: response.data.message || "Failed to create split",
				});
			}
		} catch (error: any) {
			console.error("Create split error:", error);
			res.status(500).json({
				status: false,
				message: error.response?.data?.message || "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Verify Paystack payment
	 * @route GET /api/payments/verify/:reference
	 * @access Client (authenticated)
	 */
	static async verifyPayment(req: Request, res: Response): Promise<void> {
		try {
			const { reference } = req.params;

			if (!reference) {
				res.status(400).json({
					status: false,
					message: "Payment reference is required",
				});
				return;
			}

			if (!isPaystackConfigured()) {
				res.status(500).json({
					success: false,
					message: "Payment service is not configured",
				});
				return;
			}
			const response = await paystackApi.get(`/transaction/verify/${reference}`);

			if (response.data.status) {
				const transaction = response.data.data;

			// Update print job payment status if metadata contains jobId
			if (transaction.metadata && transaction.metadata.jobId) {
				const jobId = transaction.metadata.jobId;
				if (mongoose.Types.ObjectId.isValid(jobId)) {
					const printJob: any = await pdfPrintModel.findById(jobId);
					if (printJob) {
						printJob.paymentStatus =
							transaction.status === "success" ? "paid" : "pending";
						if (transaction.status === "success") {
							printJob.paymentReference = reference;
							printJob.paidAt = new Date();
						}
						await printJob.save();
					}
				}
			}

				res.status(200).json({
					status: true,
					message: "Payment verified successfully",
					data: {
						status: transaction.status,
						reference: transaction.reference,
						amount: transaction.amount / 100,
						customer: {
							email: transaction.customer?.email || transaction.email,
						},
						paidAt: transaction.paidAt,
						channel: transaction.channel,
						currency: transaction.currency,
					},
				});
			} else {
				res.status(400).json({
					status: false,
					message: response.data.message || "Failed to verify payment",
				});
			}
		} catch (error: any) {
			console.error("Verify payment error:", error);
			res.status(500).json({
				status: false,
				message: error.response?.data?.message || "Internal server error",
				error: error.message,
			});
		}
	}

	/**
	 * Get payment history for a user
	 * @route GET /api/payments/history
	 * @access Client (authenticated)
	 */
	static async getPaymentHistory(req: Request, res: Response): Promise<void> {
		try {
			const clientId = (req as any).client?.clientId;
			if (!clientId) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			// Get all print jobs for this client with payment information
			const printJobs = await pdfPrintModel
				.find({ clientId })
				.select("paymentStatus paymentReference paidAt totalPrice createdAt")
				.sort({ createdAt: -1 })
				.lean();

			res.status(200).json({
				success: true,
				message: "Payment history retrieved successfully",
				data: printJobs,
				count: printJobs.length,
			});
		} catch (error: any) {
			console.error("Get payment history error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
				error: error.message,
			});
		}
	}
}

