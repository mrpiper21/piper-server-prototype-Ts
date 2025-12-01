import { Router } from 'express';
import { SupportController } from '../controllers/support.controller.js';
import { AuthController } from '../controllers/auth.controller.js';
import { ClientController } from '../controllers/client.controller.js';
import { supportValidation } from '../middleware/validation.js';

const router = Router();

/**
 * Public route - Create support ticket
 * Anyone can create support tickets (no authentication required)
 */
router.post('/',
  supportValidation.create,
  SupportController.createSupportTicket
);

/**
 * Admin/Clerk routes - Get all support tickets
 * Admins/Clerks can get all support tickets for their admin
 * Must come before generic GET / to avoid route conflicts
 */
router.get('/admin/all',
  AuthController.verifyToken,
  SupportController.getSupportTickets
);

/**
 * Admin/Clerk routes - Get support tickets for a specific job
 * Admins/Clerks can get support tickets for jobs belonging to their admin
 * Must come before generic routes to avoid route conflicts
 */
router.get('/admin/job/:jobId',
  AuthController.verifyToken,
  supportValidation.getByJob,
  SupportController.getSupportTicketsByJob
);

/**
 * Admin/Clerk routes - Get support tickets for a specific client
 * Admins/Clerks can get support tickets for clients belonging to their admin
 * Must come before generic routes to avoid route conflicts
 */
router.get('/admin/client/:clientId',
  AuthController.verifyToken,
  supportValidation.getByClient,
  SupportController.getSupportTicketsByClient
);

/**
 * Admin/Clerk routes - Get support ticket by ID
 * Admins/Clerks can get support tickets for their admin
 * Must come before generic /:id route to avoid route conflicts
 */
router.get('/admin/:id',
  AuthController.verifyToken,
  supportValidation.getById,
  SupportController.getSupportTicketById
);

/**
 * Admin/Clerk routes - Update support ticket (add response)
 * Admins/Clerks can update support tickets for their admin
 */
router.put('/admin/:id',
  AuthController.verifyToken,
  supportValidation.getById,
  supportValidation.update,
  SupportController.updateSupportTicket
);

/**
 * Admin/Clerk routes - Delete support ticket
 * Admins/Clerks can delete support tickets for their admin
 */
router.delete('/admin/:id',
  AuthController.verifyToken,
  supportValidation.getById,
  SupportController.deleteSupportTicket
);

/**
 * Client routes - Get own support tickets
 * Clients can get their own support tickets
 */
router.get('/',
  ClientController.verifyToken,
  SupportController.getSupportTickets
);

/**
 * Client routes - Get support tickets for a specific job
 * Clients can get support tickets for their own jobs
 */
router.get('/job/:jobId',
  ClientController.verifyToken,
  supportValidation.getByJob,
  SupportController.getSupportTicketsByJob
);

/**
 * Client routes - Get support tickets for a specific client
 * Clients can get their own support tickets
 */
router.get('/client/:clientId',
  ClientController.verifyToken,
  supportValidation.getByClient,
  SupportController.getSupportTicketsByClient
);

/**
 * Client routes - Get support ticket by ID
 * Clients can get their own support ticket by ID
 * Must come last to avoid conflicts with /admin/:id
 */
router.get('/:id',
  ClientController.verifyToken,
  supportValidation.getById,
  SupportController.getSupportTicketById
);

export default router;

