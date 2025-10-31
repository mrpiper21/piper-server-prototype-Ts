import { Router } from 'express';
import { ClientController } from '../controllers/client.controller.js';
import { clientValidation } from '../middleware/validation.js';

const router = Router();

/**
 * Public routes - Client Authentication
 */

/**
 * @route   POST /api/clients/register
 * @desc    Register a new client
 * @access  Public
 */
router.post('/register',
  clientValidation.register,
  ClientController.register
);

/**
 * @route   POST /api/clients/login
 * @desc    Login client
 * @access  Public
 */
router.post('/login',
  clientValidation.login,
  ClientController.login
);

/**
 * Protected routes - Client Profile Management
 * All routes below require client authentication
 */
router.use(ClientController.verifyToken);

/**
 * @route   GET /api/clients/profile
 * @desc    Get current client profile
 * @access  Client only
 */
router.get('/profile',
  ClientController.getProfile
);

/**
 * @route   PUT /api/clients/profile
 * @desc    Update current client profile
 * @access  Client only
 */
router.put('/profile',
  clientValidation.updateProfile,
  ClientController.updateProfile
);

/**
 * @route   PUT /api/clients/profile/change-password
 * @desc    Change client password
 * @access  Client only
 */
router.put('/profile/change-password',
  clientValidation.changePassword,
  ClientController.changePassword
);

/**
 * Admin/Staff routes - Client Management
 * Note: These routes should have additional middleware to check if the requester is admin/staff
 * For now, they're protected by client token, but you should add role-based access control
 */

/**
 * @route   GET /api/clients
 * @desc    Get all clients with pagination and filtering
 * @access  Admin/Staff only (add role check middleware)
 */
router.get('/',
  clientValidation.getAllClients,
  ClientController.getAllClients
);

/**
 * @route   GET /api/clients/stats
 * @desc    Get client statistics
 * @access  Admin/Staff only (add role check middleware)
 */
router.get('/stats',
  ClientController.getClientStats
);

/**
 * @route   GET /api/clients/:id
 * @desc    Get client by ID
 * @access  Admin/Staff or the client themselves (add role/ownership check)
 */
router.get('/:id',
  clientValidation.getClientById,
  ClientController.getClientById
);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client
 * @access  Admin/Staff only (add role check middleware)
 */
router.put('/:id',
  clientValidation.updateClient,
  ClientController.updateClient
);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete (deactivate) client
 * @access  Admin/Staff only (add role check middleware)
 */
router.delete('/:id',
  clientValidation.deleteClient,
  ClientController.deleteClient
);

export default router;

