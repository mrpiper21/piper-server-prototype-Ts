import { type Request, type Response } from "express";
import { validationResult } from "express-validator";
import { paystackApi, isPaystackConfigured } from "../config/paystackConfig.js";
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
			// Validation is handled by express-validator middleware
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				console.error("Payment initialization validation errors:", errors.array());
				res.status(400).json({
					status: false,
					message: "Validation failed",
					errors: errors.array(),
				});
				return;
			}

			if (!isPaystackConfigured()) {
				res.status(500).json({
					status: false,
					message: "Payment service is not configured",
				});
				return;
			}

			const {
				amount,
				email,
				subaccount,
				split_code,
				metadata,
				callback_url,
				currency,
			} = req.body;

			// Build transaction data
			const transactionData: any = {
				amount: Number(amount) * 100, // Convert to smallest currency unit
				email,
				currency: currency || "GHS",
			};

			// Add optional fields
			if (subaccount) transactionData.subaccount = subaccount;
			if (split_code) transactionData.split_code = split_code;
			if (metadata) transactionData.metadata = metadata;
			if (callback_url) transactionData.callback_url = callback_url;

			// Initialize transaction with Paystack
			const response = await paystackApi.post(
				"/transaction/initialize",
				transactionData
			);

			console.log("initialize payment response", response.data.data);

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
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({
					status: false,
					message: "Validation failed",
					errors: errors.array(),
				});
				return;
			}

			if (!isPaystackConfigured()) {
				res.status(500).json({
					status: false,
					message: "Payment service is not configured",
				});
				return;
			}

			const { name, type, currency, subaccounts, bearer_type, bearer_subaccount } = req.body;

			// Validate split type
			if (!["percentage", "flat"].includes(type)) {
				res.status(400).json({
					status: false,
					message: "Split type must be 'percentage' or 'flat'",
				});
				return;
			}

			// Validate bearer_type if provided
			if (bearer_type && !["account", "subaccount"].includes(bearer_type)) {
				res.status(400).json({
					status: false,
					message: "Bearer type must be 'account' or 'subaccount'",
				});
				return;
			}

			// If bearer_type is "subaccount", bearer_subaccount is required
			if (bearer_type === "subaccount" && !bearer_subaccount) {
				res.status(400).json({
					status: false,
					message: "bearer_subaccount is required when bearer_type is 'subaccount'",
				});
				return;
			}

			// Prepare split data according to Paystack API
			const splitData: any = {
				name,
				type,
				currency: currency.toUpperCase(),
				subaccounts: subaccounts.map((sub: any) => ({
					subaccount: sub.subaccount,
					share: Number(sub.share),
				})),
			};

			// Add bearer information if provided (who bears transaction charges)
			if (bearer_type) {
				splitData.bearer_type = bearer_type;
			}
			if (bearer_subaccount) {
				splitData.bearer_subaccount = bearer_subaccount;
			}

			const response = await paystackApi.post("/split", splitData);

			if (response.data.status) {
				res.status(200).json({
					status: true,
					message: "Split created successfully",
					data: {
						split_code: response.data.data.split_code,
						name: response.data.data.name,
						type: response.data.data.type,
						currency: response.data.data.currency,
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
					status: false,
					message: "Payment service is not configured",
				});
				return;
			}

			// Verify payment with Paystack
			const paystackResponse = await paystackApi.get(
				`/transaction/verify/${reference}`
			);

			// If Paystack API call failed
			if (!paystackResponse.data.status) {
				res.status(400).json({
					status: false,
					message: paystackResponse.data.message || "Failed to verify payment",
				});
				return;
			}

			const transaction = paystackResponse.data.data;
			const transactionStatus = transaction?.status || "pending";

			// Update print job payment status if jobId exists in metadata
			// Wrap in try-catch so database errors don't fail the whole request
			try {
				if (transaction?.metadata?.jobId) {
					const jobId = transaction.metadata.jobId;
					if (mongoose.Types.ObjectId.isValid(jobId)) {
						const printJob = await pdfPrintModel.findById(jobId);
						if (printJob) {
							// Map Paystack status to our payment status
							// Valid values: "pending" | "paid" | "failed" | "refunded"
							const statusMap: Record<
								string,
								"pending" | "paid" | "failed" | "refunded"
							> = {
								success: "paid",
								abandoned: "failed", // Map abandoned to failed
								failed: "failed",
							};

							printJob.paymentStatus =
								statusMap[transactionStatus] || "pending";

							if (transactionStatus === "success") {
								printJob.paymentReference = reference;
								printJob.paidAt = new Date();
							}

							await printJob.save();
						}
					}
				}
			} catch (dbError: any) {
				// Log database error but don't fail the payment verification
				console.error("Error updating print job payment status:", dbError);
			}

			// Prepare response data with safe property access
			const responseData: any = {
				status: transactionStatus, // Actual transaction status: "success", "failed", "abandoned", "pending"
				reference: transaction?.reference || reference,
				amount: transaction?.amount ? transaction.amount / 100 : 0,
				customer: {
					email: transaction?.customer?.email || transaction?.email || "",
				},
				channel: transaction?.channel || null,
				currency: transaction?.currency || "GHS",
			};

			// Include split information if available (for split payments)
			if (transaction?.split) {
				responseData.split = {
					split_code: transaction.split.split_code,
					shares: transaction.split.shares || [],
				};
			}

			// Always return status: true when API call succeeds
			// Frontend checks data.status for actual transaction status
			res.status(200).json({
				status: true, // API call succeeded
				message: PaymentController.getStatusMessage(transactionStatus),
				data: {
					...responseData,
					...(transactionStatus === "success" &&
						transaction?.paidAt && { paidAt: transaction.paidAt }),
				},
			});
		} catch (error: any) {
			console.error("Verify payment error:", error);
			console.error("Error details:", {
				message: error.message,
				stack: error.stack,
				response: error.response?.data,
			});
			res.status(500).json({
				status: false,
				message:
					error.response?.data?.message ||
					error.message ||
					"Internal server error",
			});
		}
	}

	/**
	 * Get status message based on transaction status
	 */
	private static getStatusMessage(status: string): string {
		const messages: Record<string, string> = {
			success: "Payment verified successfully",
			failed: "Payment failed",
			abandoned: "Payment was cancelled",
			pending: "Payment is pending verification",
		};
		return messages[status] || `Payment status: ${status}`;
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
					status: false,
					message: "Unauthorized",
				});
				return;
			}

			const printJobs = await pdfPrintModel
				.find({ clientId })
				.select("paymentStatus paymentReference paidAt totalPrice createdAt")
				.sort({ createdAt: -1 })
				.lean();

			res.status(200).json({
				status: true,
				message: "Payment history retrieved successfully",
				data: printJobs,
				count: printJobs.length,
			});
		} catch (error: any) {
			console.error("Get payment history error:", error);
			res.status(500).json({
				status: false,
				message: "Internal server error",
			});
		}
	}
}
