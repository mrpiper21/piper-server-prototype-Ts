import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { AuthController } from '../controllers/auth.controller.js';
import { userValidation } from '../middleware/validation.js';
import { Permission, UserRole } from '../models/user.model.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(AuthController.verifyToken);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Admin only
 */
router.get('/', 
  AuthController.checkPermission(Permission.MANAGE_USERS),
  userValidation.getAllUsers,
  UserController.getAllUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Admin only
 */
router.get('/stats', 
  AuthController.checkPermission(Permission.MANAGE_USERS),
  UserController.getUserStats
);

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by role
 * @access  Admin/Manager only
 */
router.get('/role/:role', 
  AuthController.checkRole([UserRole.ADMIN, UserRole.MANAGER]),
  userValidation.getUsersByRole,
  UserController.getUsersByRole
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin/Manager only
 */
router.get('/:id', 
  AuthController.checkRole([UserRole.ADMIN, UserRole.MANAGER]),
  userValidation.getUserById,
  UserController.getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Admin only
 */
router.post('/', 
  AuthController.checkPermission(Permission.MANAGE_USERS),
  userValidation.createUser,
  UserController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Admin only
 */
router.put('/:id', 
  AuthController.checkPermission(Permission.MANAGE_USERS),
  userValidation.updateUser,
  UserController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete (deactivate) user
 * @access  Admin only
 */
router.delete('/:id', 
  AuthController.checkPermission(Permission.MANAGE_USERS),
  userValidation.deleteUser,
  UserController.deleteUser
);

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Admin only
 */
router.put('/:id/reset-password', 
  AuthController.checkPermission(Permission.MANAGE_USERS),
  userValidation.resetPassword,
  UserController.resetPassword
);

/**
 * @route   PUT /api/users/bulk-update-roles
 * @desc    Bulk update user roles
 * @access  Admin only
 */
router.put('/bulk-update-roles', 
  AuthController.checkPermission(Permission.MANAGE_USERS),
  userValidation.bulkUpdateRoles,
  UserController.bulkUpdateRoles
);

export default router;
