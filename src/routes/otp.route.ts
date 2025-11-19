import express from 'express';
import type { Request, Response } from 'express';
import { OTPController } from '../controllers/otp.controller.js';
import { otpValidation } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   POST /api/otp/send-otp
 * @desc    Send OTP to email for verification
 * @access  Public
 */
router.post(
  '/send-otp',
  otpValidation.sendOTP,
  (req: Request, res: Response) => {
    OTPController.sendOTP(req, res);
  }
);

/**
 * @route   POST /api/otp/verify-otp
 * @desc    Verify OTP code
 * @access  Public
 */
router.post(
  '/verify-otp',
  otpValidation.verifyOTP,
  (req: Request, res: Response) => {
    OTPController.verifyOTP(req, res);
  }
);

/**
 * @route   POST /api/otp/resend-otp
 * @desc    Resend OTP to email
 * @access  Public
 */
router.post(
  '/resend-otp',
  otpValidation.resendOTP,
  (req: Request, res: Response) => {
    OTPController.resendOTP(req, res);
  }
);

/**
 * @route   GET /api/otp/check-verification/:email
 * @desc    Check if email is verified
 * @access  Public
 */
router.get(
  '/check-verification/:email',
  otpValidation.checkVerification,
  (req: Request, res: Response) => {
    OTPController.checkVerification(req, res);
  }
);

export default router;
