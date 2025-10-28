import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authValidation } from '../middleware/validation.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authValidation.register, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authValidation.login, AuthController.login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', AuthController.verifyToken, AuthController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
  AuthController.verifyToken, 
  authValidation.updateProfile, 
  AuthController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', 
  AuthController.verifyToken, 
  authValidation.changePassword, 
  AuthController.changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', AuthController.verifyToken, AuthController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh authentication token
 * @access  Private
 */
router.post('/refresh', AuthController.verifyToken, AuthController.refreshToken);

export default router;
