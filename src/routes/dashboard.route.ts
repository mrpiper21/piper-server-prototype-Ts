import express from 'express';
import type { Request, Response } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

// Dashboard stats (today's jobs, counters, filtered by date)
router.get('/stats', (req: Request, res: Response) => dashboardController.getDashboardStats(req, res));

// Weekly activity: job counts for each of past 7 days
router.get('/weekly', (req: Request, res: Response) => dashboardController.getWeeklyActivity(req, res));

// Jobs by date (pass ?date=YYYY-MM-DD)
router.get('/jobs-by-date', (req: Request, res: Response) => dashboardController.getJobsByDate(req, res));

export default router;