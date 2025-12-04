import express from 'express';
import type { Request, Response } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { AuthController } from '../controllers/auth.controller.js';

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(AuthController.verifyToken);

// Dashboard stats (today's jobs, counters, filtered by date)
router.get('/stats', (req: Request, res: Response) => dashboardController.getDashboardStats(req, res));

// Weekly activity: job counts for each of past 7 days
router.get('/weekly', (req: Request, res: Response) => dashboardController.getWeeklyActivity(req, res));

// Jobs by date (pass ?date=YYYY-MM-DD)
router.get('/jobs-by-date', (req: Request, res: Response) => dashboardController.getJobsByDate(req, res));

// Category analytics (pass ?days=30 for last 30 days)
router.get('/category-analytics', (req: Request, res: Response) => dashboardController.getCategoryAnalytics(req, res));

// Payment analytics (pass ?days=30 for last 30 days)
router.get('/payment-analytics', (req: Request, res: Response) => dashboardController.getPaymentAnalytics(req, res));

// Comprehensive report (pass ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD)
router.get('/comprehensive-report', (req: Request, res: Response) => dashboardController.getComprehensiveReport(req, res));

export default router;