import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { ClientController } from "../controllers/client.controller.js";
import { AuthController } from "../controllers/auth.controller.js";
import { paymentValidation } from "../middleware/validation.js";

const router = Router();

/**
 * @route   POST /api/payments/initialize
 * @desc    Initialize Paystack payment
 * @access  Client (authenticated)
 */
router.post(
	"/initialize",
	ClientController.verifyToken,
	paymentValidation.initialize,
	PaymentController.initializePayment
);

/**
 * @route   POST /api/payments/split/create
 * @desc    Create Paystack split payment configuration
 * @access  Admin (authenticated)
 */
router.post(
	"/split/create",
	AuthController.verifyToken,
	paymentValidation.createSplit,
	PaymentController.createSplit
);

/**
 * @route   GET /api/payments/verify/:reference
 * @desc    Verify Paystack payment
 * @access  Client (authenticated)
 */
router.get(
	"/verify/:reference",
	ClientController.verifyToken,
	paymentValidation.verify,
	PaymentController.verifyPayment
);

/**
 * @route   GET /api/payments/history
 * @desc    Get payment history for authenticated client
 * @access  Client (authenticated)
 */
router.get(
	"/history",
	ClientController.verifyToken,
	PaymentController.getPaymentHistory
);

export default router;
