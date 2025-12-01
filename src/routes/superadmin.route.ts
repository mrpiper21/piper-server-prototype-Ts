import { Router } from 'express';
import { SuperAdminController } from '../controllers/superadmin.controller.js';
import { authValidation } from '../middleware/validation.js';

const router = Router();

/**
 * Public routes - SuperAdmin Authentication
 */

/**
 * @route   POST /api/superadmin/register
 * @desc    Register a new superadmin
 * @access  Public (should be protected in production)
 */
router.post('/register',
  authValidation.register,
  SuperAdminController.register
);

/**
 * @route   POST /api/superadmin/login
 * @desc    Login superadmin
 * @access  Public
 */
router.post('/login',
  authValidation.login,
  SuperAdminController.login
);


/**
 * @route   POST /api/superadmin/setup-business-subaccount
 * @desc    Set up business subaccount
 * @access  SuperAdmin only
 */
router.post('/setup-business-subaccount/:userId',
  SuperAdminController.setUpBussinessSubaccount
);

/**
 * Protected routes - SuperAdmin Management
 * All routes below require superadmin authentication
 */
router.use(SuperAdminController.verifyToken);

/**
 * @route   GET /api/superadmin/stats
 * @desc    Get dashboard statistics
 * @access  SuperAdmin only
 */
router.get('/stats',
  SuperAdminController.getDashboardStats
);

/**
 * @route   GET /api/superadmin/users
 * @desc    Get all users (admins)
 * @access  SuperAdmin only
 */
router.get('/users',
  SuperAdminController.getAllUsers
);

/**
 * @route   GET /api/superadmin/users/:id
 * @desc    Get user by ID
 * @access  SuperAdmin only
 */
router.get('/users/:id',
  SuperAdminController.getUserById
);

/**
 * @route   PUT /api/superadmin/users/:id
 * @desc    Update user
 * @access  SuperAdmin only
 */
router.put('/users/:id',
  SuperAdminController.updateUser
);

/**
 * @route   DELETE /api/superadmin/users/:id
 * @desc    Delete (deactivate) user
 * @access  SuperAdmin only
 */
router.delete('/users/:id',
  SuperAdminController.deleteUser
);

/**
 * @route   GET /api/superadmin/clerks
 * @desc    Get all clerks
 * @access  SuperAdmin only
 */
router.get('/clerks',
  SuperAdminController.getAllClerks
);

/**
 * @route   GET /api/superadmin/clients
 * @desc    Get all clients
 * @access  SuperAdmin only
 */
router.get('/clients',
  SuperAdminController.getAllClients
);

/**
 * @route   GET /api/superadmin/support
 * @desc    Get all support tickets
 * @access  SuperAdmin only
 */
router.get('/support',
  SuperAdminController.getAllSupportTickets
);

/**
 * @route   GET /api/superadmin/support/:id
 * @desc    Get support ticket by ID
 * @access  SuperAdmin only
 */
router.get('/support/:id',
  SuperAdminController.getSupportTicketById
);

/**
 * @route   PUT /api/superadmin/support/:id
 * @desc    Update support ticket
 * @access  SuperAdmin only
 */
router.put('/support/:id',
  SuperAdminController.updateSupportTicket
);

/**
 * @route   DELETE /api/superadmin/support/:id
 * @desc    Delete support ticket
 * @access  SuperAdmin only
 */
router.delete('/support/:id',
  SuperAdminController.deleteSupportTicket
);

export default router;

