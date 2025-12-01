import type { Request, Response } from 'express';
import pdfPrintModel from '../models/printer.model.js';
import { UserRole } from "../models/shared/enums.js";

class DashboardController {
	// Get dashboard job stats (today's jobs, completed, pending, failed, total, filtered by date)
	private async buildAdminIdFilter(user: any): Promise<Record<string, any>> {
		const filter: Record<string, any> = {};
		const mongoose = (await import("mongoose")).default;

		if (!user) {
			// If no user, return empty filter (should not happen if auth middleware is applied)
			// This is a security fallback - should never occur in practice
			return filter;
		}

		// Clerks can only see jobs for their admin
		if (user.adminId) {
			if (!mongoose.Types.ObjectId.isValid(user.adminId)) {
				throw new Error("Invalid adminId for clerk");
			}
			filter.adminId = new mongoose.Types.ObjectId(user.adminId);
		}
		// Admins can only see their own jobs
		else if (user.role === UserRole.ADMIN && user.userId) {
			if (!mongoose.Types.ObjectId.isValid(user.userId)) {
				throw new Error("Invalid userId for admin");
			}
			filter.adminId = new mongoose.Types.ObjectId(user.userId);
		}
		// If user exists but doesn't match expected structure, this is a security issue
		// Return an empty filter that will result in no jobs being returned
		// This prevents unauthorized access to all jobs
		else {
			// Return a filter that matches nothing (invalid ObjectId)
			// This ensures no jobs are returned if user structure is unexpected
			filter.adminId = new mongoose.Types.ObjectId("000000000000000000000000");
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

			const filteredJobs = await pdfPrintModel
				.find(filter)
				.populate("clientId");

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

			const jobs = await pdfPrintModel
				.find({
					...adminIdFilter,
					createdAt: { $gte: d, $lte: endD },
				})
				.populate("clientId");
			res.json({ success: true, data: jobs });
		} catch (err) {
			res
				.status(500)
				.json({ success: false, message: "Jobs-by-date error", err });
		}
	}
}

export default new DashboardController();