import type { Request, Response } from 'express';
import pdfPrintModel from '../models/printer.model.js';

class DashboardController {
	// Get dashboard job stats (today's jobs, completed, pending, failed, total, filtered by date)
	private async buildAdminIdFilter(user: any): Promise<Record<string, any>> {
		const filter: Record<string, any> = {};

		if (user) {
			const mongoose = (await import("mongoose")).default;
			if (user.adminId) {
				// Clerks can only see jobs for their admin
				filter.adminId = new mongoose.Types.ObjectId(user.adminId);
			} else if (user.role === "admin" && user.userId) {
				// Admins can see all their jobs
				filter.adminId = new mongoose.Types.ObjectId(user.userId);
			}
		}

		return filter;
	}
	async getDashboardStats(req: Request, res: Response) {
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const endOfDay = new Date(today);
			endOfDay.setHours(23, 59, 59, 999);

			// Filter by adminId based on user role
			const user = (req as any).user;
			const adminIdFilter = await this.buildAdminIdFilter(user);

			const jobsToday = await pdfPrintModel
				.find({
					...adminIdFilter,
					createdAt: { $gte: today, $lte: endOfDay },
				})
				.populate("clientId");

			const filter: any = { ...adminIdFilter };
			if (req.query.selectedDate) {
				const selectedDate = new Date(req.query.selectedDate as string);
				selectedDate.setHours(0, 0, 0, 0);
				const endSelectedDate = new Date(selectedDate);
				endSelectedDate.setHours(23, 59, 59, 999);
				filter.createdAt = { $gte: selectedDate, $lte: endSelectedDate };
			}

			const filteredJobs = await pdfPrintModel.find(filter).populate("clientId");

			const completedJobs = filteredJobs.filter(
				(j) => j.status === "completed"
			).length;
			const pendingJobs = filteredJobs.filter(
				(j) => j.status === "pending" || j.status === "processing"
			).length;
			const failedJobs = filteredJobs.filter(
				(j) => j.status === "failed"
			).length;
			const totalJobs = filteredJobs.length;

			res.json({
				success: true,
				data: {
					todaysJobs: jobsToday.length,
					completedJobs,
					pendingJobs,
					failedJobs,
					totalJobs,
				},
			});
		} catch (err) {
			res
				.status(500)
				.json({ success: false, message: "Dashboard stats error", err });
		}
	}

	// Get job count for each of the last 7 days (weekly activity)
	async getWeeklyActivity(req: Request, res: Response) {
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const days = 7;
			const result: any[] = [];

			// Filter by adminId based on user role
			const user = (req as any).user;
			const adminIdFilter = await this.buildAdminIdFilter(user);

			for (let i = 0; i < days; i++) {
				const d = new Date(today);
				d.setDate(today.getDate() - i);
				const dayStart = new Date(d);
				const dayEnd = new Date(d);
				dayEnd.setHours(23, 59, 59, 999);
				const count = await pdfPrintModel.countDocuments({
					...adminIdFilter,
					createdAt: { $gte: dayStart, $lte: dayEnd },
				});
				result.push({ date: dayStart.toISOString().split("T")[0], count });
			}
			res.json({ success: true, data: result.reverse() });
		} catch (err) {
			res
				.status(500)
				.json({ success: false, message: "Weekly activity error", err });
		}
	}

	// Get all print jobs for a specific date
	async getJobsByDate(req: Request, res: Response) {
		try {
			const { date } = req.query;
			if (!date) {
				return res
					.status(400)
					.json({ success: false, message: "date is required" });
			}
			const d = new Date(date as string);
			d.setHours(0, 0, 0, 0);
			const endD = new Date(d);
			endD.setHours(23, 59, 59, 999);

			// Filter by adminId based on user role
			const user = (req as any).user;
			const adminIdFilter = await this.buildAdminIdFilter(user);

			const jobs = await pdfPrintModel.find({
				...adminIdFilter,
				createdAt: { $gte: d, $lte: endD },
			}).populate("clientId");
			res.json({ success: true, data: jobs });
		} catch (err) {
			res
				.status(500)
				.json({ success: false, message: "Jobs-by-date error", err });
		}
	}
}

export default new DashboardController();