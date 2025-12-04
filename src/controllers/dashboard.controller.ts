import type { Request, Response } from 'express';
import pdfPrintModel from '../models/printer.model.js';
import categoryModel from '../models/category.model.js';
import User from '../models/user.model.js';
import { UserRole } from "../models/shared/enums.js";

class DashboardController {
	private async buildAdminIdFilter(user: any): Promise<Record<string, any>> {
		const filter: Record<string, any> = {};
		const mongoose = (await import("mongoose")).default;

		if (!user) {
			return filter;
		}

		if (user.adminId) {
			if (!mongoose.Types.ObjectId.isValid(user.adminId)) {
				throw new Error("Invalid adminId for clerk");
			}
			filter.adminId = new mongoose.Types.ObjectId(user.adminId);
		} else if (user.role === UserRole.ADMIN && user.userId) {
			if (!mongoose.Types.ObjectId.isValid(user.userId)) {
				throw new Error("Invalid userId for admin");
			}
			filter.adminId = new mongoose.Types.ObjectId(user.userId);
		} else {
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

			const user = (req as any).user;
			const adminIdFilter = await this.buildAdminIdFilter(user);

			const jobsToday = await pdfPrintModel
				.find({
					...adminIdFilter,
					createdAt: { $gte: today, $lte: endOfDay },
				})
				.populate("clientId")
				.populate("categoryId");

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
				.populate("clientId")
				.populate("categoryId");

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

			// Calculate revenue metrics for selected month (default to current month)
			let revenueFilter: any = { ...adminIdFilter };
			const now = new Date();
			
			// Determine month start and end dates
			let monthStart: Date;
			let monthEnd: Date;
			
			if (req.query.month && req.query.year) {
				// Specific month selected (format: YYYY-MM)
				const year = parseInt(req.query.year as string);
				const month = parseInt(req.query.month as string) - 1; // Month is 0-indexed
				monthStart = new Date(year, month, 1);
				monthStart.setHours(0, 0, 0, 0);
				monthEnd = new Date(year, month + 1, 0);
				monthEnd.setHours(23, 59, 59, 999);
			} else {
				// Default to current month
				monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
				monthStart.setHours(0, 0, 0, 0);
				monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
				monthEnd.setHours(23, 59, 59, 999);
			}

			// Format month string (YYYY-MM) - using non-null assertion since monthStart is always defined
			const revenueMonth = monthStart!.toISOString().split('T')[0]!.substring(0, 7);

			revenueFilter.createdAt = { $gte: monthStart, $lte: monthEnd };
			revenueFilter.paymentStatus = "paid";

			const revenueJobs = await pdfPrintModel
				.find(revenueFilter)
				.populate("clientId")
				.populate("categoryId");

			const totalRevenue: number = revenueJobs
				.filter((j) => j.totalPrice)
				.reduce((sum, j) => sum + (j.totalPrice || 0), 0);

			const pendingRevenueFilter: any = { ...adminIdFilter };
			pendingRevenueFilter.createdAt = { $gte: monthStart, $lte: monthEnd };
			pendingRevenueFilter.paymentStatus = "pending";

			const pendingRevenueJobs = await pdfPrintModel
				.find(pendingRevenueFilter)
				.populate("clientId")
				.populate("categoryId");

			const pendingRevenue = pendingRevenueJobs
				.filter((j) => j.totalPrice)
				.reduce((sum, j) => sum + (j.totalPrice || 0), 0);

			const paidJobs = revenueJobs.length;

			res.json({
				success: true,
				data: {
					todaysJobs: jobsToday.length,
					completedJobs,
					pendingJobs,
					failedJobs,
					totalJobs,
					totalRevenue,
					pendingRevenue,
					paidJobs,
					revenueMonth, // YYYY-MM format
				},
			});
		} catch (err) {
			res
				.status(500)
				.json({ success: false, message: "Dashboard stats error", err });
		}
	}

	async getWeeklyActivity(req: Request, res: Response) {
		try {
			const user = (req as any).user;
			const adminIdFilter = await this.buildAdminIdFilter(user);

			// Determine month to use (from query params or default to current month)
			let monthStart: Date;
			let monthEnd: Date;

			if (req.query.month && req.query.year) {
				const year = parseInt(req.query.year as string);
				const month = parseInt(req.query.month as string) - 1; // Month is 0-indexed
				monthStart = new Date(year, month, 1);
				monthStart.setHours(0, 0, 0, 0);
				monthEnd = new Date(year, month + 1, 0);
				monthEnd.setHours(23, 59, 59, 999);
			} else {
				const today = new Date();
				monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
				monthStart.setHours(0, 0, 0, 0);
				monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
				monthEnd.setHours(23, 59, 59, 999);
			}

			// Get all days in the selected month
			const daysInMonth = monthEnd.getDate();
			const result: any[] = [];

			for (let day = 1; day <= daysInMonth; day++) {
				const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
				const dayStart = new Date(d);
				dayStart.setHours(0, 0, 0, 0);
				const dayEnd = new Date(d);
				dayEnd.setHours(23, 59, 59, 999);
				const count = await pdfPrintModel.countDocuments({
					...adminIdFilter,
					createdAt: { $gte: dayStart, $lte: dayEnd },
				});
				result.push({ date: dayStart.toISOString().split("T")[0], count });
			}
			res.json({ success: true, data: result });
		} catch (err) {
			res
				.status(500)
				.json({ success: false, message: "Weekly activity error", err });
		}
	}

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

			const user = (req as any).user;
			const adminIdFilter = await this.buildAdminIdFilter(user);

			const jobs = await pdfPrintModel
				.find({
					...adminIdFilter,
					createdAt: { $gte: d, $lte: endD },
				})
				.populate("clientId")
				.populate("categoryId");
			res.json({ success: true, data: jobs });
		} catch (err) {
			res
				.status(500)
				.json({ success: false, message: "Jobs-by-date error", err });
		}
	}

	async getCategoryAnalytics(req: Request, res: Response) {
		try {
			const user = (req as any).user;
			const adminIdFilter = await this.buildAdminIdFilter(user);

			// Get date range from query params (default to last 30 days)
			const days = parseInt(req.query.days as string) || 30;
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - days);
			startDate.setHours(0, 0, 0, 0);

			const filter: any = {
				...adminIdFilter,
				createdAt: { $gte: startDate },
			};

			// Get all jobs with category populated
			const jobs = await pdfPrintModel
				.find(filter)
				.populate("categoryId")
				.populate("clientId");

			// Group by category
			const categoryMap = new Map();
			jobs.forEach((job: any) => {
				const categoryId = job.categoryId?._id?.toString() || "uncategorized";
				const categoryName = job.categoryId?.name || "Uncategorized";
				const categoryType = job.categoryId?.categoryType || "unknown";

				if (!categoryMap.has(categoryId)) {
					categoryMap.set(categoryId, {
						categoryId,
						categoryName,
						categoryType,
						totalJobs: 0,
						completedJobs: 0,
						pendingJobs: 0,
						failedJobs: 0,
						totalRevenue: 0,
						paidRevenue: 0,
						pendingRevenue: 0,
					});
				}

				const stats = categoryMap.get(categoryId);
				stats.totalJobs++;

				if (job.status === "completed") stats.completedJobs++;
				if (job.status === "pending" || job.status === "processing") stats.pendingJobs++;
				if (job.status === "failed") stats.failedJobs++;

				if (job.totalPrice) {
					stats.totalRevenue += job.totalPrice;
					if (job.paymentStatus === "paid") {
						stats.paidRevenue += job.totalPrice;
					} else if (job.paymentStatus === "pending") {
						stats.pendingRevenue += job.totalPrice;
					}
				}
			});

			const categoryAnalytics = Array.from(categoryMap.values());

			res.json({
				success: true,
				data: categoryAnalytics,
			});
		} catch (err) {
			res
				.status(500)
				.json({ success: false, message: "Category analytics error", err });
		}
	}

	async getPaymentAnalytics(req: Request, res: Response) {
		try {
			const user = (req as any).user;
			const adminIdFilter = await this.buildAdminIdFilter(user);

			// Get date range from query params (default to last 30 days)
			const days = parseInt(req.query.days as string) || 30;
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - days);
			startDate.setHours(0, 0, 0, 0);

			const filter: any = {
				...adminIdFilter,
				createdAt: { $gte: startDate },
			};

			const jobs = await pdfPrintModel
				.find(filter)
				.populate("clientId")
				.populate("categoryId");

			// Payment status breakdown
			const paymentStats = {
				paid: { count: 0, revenue: 0 },
				pending: { count: 0, revenue: 0 },
				failed: { count: 0, revenue: 0 },
				refunded: { count: 0, revenue: 0 },
			};

			let totalRevenue = 0;
			let totalPendingRevenue = 0;

			jobs.forEach((job: any) => {
				const status = job.paymentStatus || "pending";
				const price = job.totalPrice || 0;

				if (paymentStats[status as keyof typeof paymentStats]) {
					paymentStats[status as keyof typeof paymentStats].count++;
					paymentStats[status as keyof typeof paymentStats].revenue += price;
				}

				if (status === "paid") {
					totalRevenue += price;
				} else if (status === "pending") {
					totalPendingRevenue += price;
				}
			});

			// Daily revenue trend (last 7 days)
			const dailyRevenue: any[] = [];
			for (let i = 6; i >= 0; i--) {
				const d = new Date();
				d.setDate(d.getDate() - i);
				d.setHours(0, 0, 0, 0);
				const dayEnd = new Date(d);
				dayEnd.setHours(23, 59, 59, 999);

				const dayJobs = jobs.filter((job: any) => {
					const jobDate = new Date(job.createdAt);
					return jobDate >= d && jobDate <= dayEnd && job.paymentStatus === "paid";
				});

				const dayRevenue = dayJobs.reduce(
					(sum: number, job: any) => sum + (job.totalPrice || 0),
					0
				);

				dailyRevenue.push({
					date: d.toISOString().split("T")[0],
					revenue: dayRevenue,
					count: dayJobs.length,
				});
			}

			res.json({
				success: true,
				data: {
					paymentStats,
					totalRevenue,
					totalPendingRevenue,
					dailyRevenue,
				},
			});
		} catch (err) {
			res
				.status(500)
				.json({ success: false, message: "Payment analytics error", err });
		}
	}

	async getComprehensiveReport(req: Request, res: Response) {
		try {
			const user = (req as any).user;
			const adminIdFilter = await this.buildAdminIdFilter(user);

			// Get date range
			const startDate = req.query.startDate
				? new Date(req.query.startDate as string)
				: new Date();
			startDate.setHours(0, 0, 0, 0);

			const endDate = req.query.endDate
				? new Date(req.query.endDate as string)
				: new Date();
			endDate.setHours(23, 59, 59, 999);

			const filter: any = {
				...adminIdFilter,
				createdAt: { $gte: startDate, $lte: endDate },
			};

			// Get user business info
			const adminId = user.adminId || user.userId;
			const businessInfo = await User.findById(adminId).select(
				"businessName businessPhone location email name"
			);

			// Get all jobs
			const jobs = await pdfPrintModel
				.find(filter)
				.populate("clientId")
				.populate("categoryId")
				.sort({ createdAt: -1 });

			// Calculate summary
			const summary = {
				totalJobs: jobs.length,
				completedJobs: jobs.filter((j) => j.status === "completed").length,
				pendingJobs: jobs.filter(
					(j) => j.status === "pending" || j.status === "processing"
				).length,
				failedJobs: jobs.filter((j) => j.status === "failed").length,
				totalRevenue: jobs
					.filter((j) => j.paymentStatus === "paid" && j.totalPrice)
					.reduce((sum, j) => sum + (j.totalPrice || 0), 0),
				pendingRevenue: jobs
					.filter((j) => j.paymentStatus === "pending" && j.totalPrice)
					.reduce((sum, j) => sum + (j.totalPrice || 0), 0),
			};

			// Category breakdown
			const categoryBreakdown = new Map();
			jobs.forEach((job: any) => {
				const categoryId = job.categoryId?._id?.toString() || "uncategorized";
				const categoryName = job.categoryId?.name || "Uncategorized";

				if (!categoryBreakdown.has(categoryId)) {
					categoryBreakdown.set(categoryId, {
						categoryName,
						count: 0,
						revenue: 0,
					});
				}

				const cat = categoryBreakdown.get(categoryId);
				cat.count++;
				if (job.paymentStatus === "paid" && job.totalPrice) {
					cat.revenue += job.totalPrice;
				}
			});

			res.json({
				success: true,
				data: {
					businessInfo,
					summary,
					jobs,
					categoryBreakdown: Array.from(categoryBreakdown.values()),
					dateRange: {
						startDate: startDate.toISOString(),
						endDate: endDate.toISOString(),
					},
				},
			});
		} catch (err) {
			res
				.status(500)
				.json({ success: false, message: "Comprehensive report error", err });
		}
	}
}

export default new DashboardController();
