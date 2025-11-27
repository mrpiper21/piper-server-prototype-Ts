import { Router } from 'express';
import type { Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { UserController } from "../controllers/user.controller.js";
import { AuthController } from "../controllers/auth.controller.js";
import { userValidation } from "../middleware/validation.js";
import { Permission, UserRole } from "../models/shared/enums.js";

const router = Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const storage = multer.diskStorage({
	destination: (
		req: Request,
		file: Express.Multer.File,
		cb: (error: Error | null, destination: string) => void
	) => {
		const uploadDir = path.join(__dirname, "../../uploads");
		// Ensure directory exists
		fs.mkdirSync(uploadDir, { recursive: true });
		cb(null, uploadDir);
	},
	filename: (
		req: Request,
		file: Express.Multer.File,
		cb: (error: Error | null, filename: string) => void
	) => {
		// Generate unique filename
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(
			null,
			`business-cover-${uniqueSuffix}${path.extname(file.originalname)}`
		);
	},
});

const imageFileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback
): void => {
	// Allowed image MIME types
	const allowedMimeTypes = [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/bmp",
	];

	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		const error = new Error(
			`File type not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`
		);
		cb(error);
	}
};

const upload = multer({
	storage,
	fileFilter: imageFileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit for images
	},
});

// Apply authentication middleware to all routes
router.use(AuthController.verifyToken);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Admin only
 */
router.get(
	"/",
	AuthController.checkPermission(Permission.MANAGE_USERS),
	userValidation.getAllUsers,
	UserController.getAllUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Admin only
 */
router.get(
	"/stats",
	AuthController.checkPermission(Permission.MANAGE_USERS),
	UserController.getUserStats
);

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by role
 * @access  Admin only
 */
router.get(
	"/role/:role",
	AuthController.checkRole([UserRole.ADMIN]),
	userValidation.getUsersByRole,
	UserController.getUsersByRole
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin only
 */
router.get(
	"/:id",
	AuthController.checkRole([UserRole.ADMIN]),
	userValidation.getUserById,
	UserController.getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Admin only
 */
router.post(
	"/",
	AuthController.checkPermission(Permission.MANAGE_USERS),
	userValidation.createUser,
	UserController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Admin only
 */
router.put(
	"/:id",
	AuthController.checkPermission(Permission.MANAGE_USERS),
	upload.single("businessCoverImage"),
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
 * @route   GET /api/users/my-clerks
 * @desc    Get clerks for the current admin
 * @access  Admin only
 */
router.get('/my-clerks/:adminId',
  // AuthController.checkRole([UserRole.ADMIN]),
  UserController.getMyClerks
);
/**
 * @route   GET /api/users/my-clerks
 * @desc    Get clerks for the current admin
 * @access  Admin only
 */
router.put('/change-clerk-password/:clerkId',
  // AuthController.checkRole([UserRole.ADMIN]),
  UserController.changeClerkPassword
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
