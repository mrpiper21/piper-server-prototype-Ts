import { type Request, type Response } from "express";
import categoryModel from "../models/category.model.js";

/**
 * Helper method to check if a station is currently open based on working hours
 * @param workingHours Array of working hours for the station
 * @returns boolean | null - true if open, false if closed, null if hours not available
 */
const isStationCurrentlyOpen = (
	workingHours?: Array<{
		day: string;
		isOpen: boolean;
		openTime?: string;
		closeTime?: string;
	}>
): boolean | null => {
	if (!workingHours || workingHours.length === 0) {
		return null;
	}

	const now = new Date();
	const dayNames = [
		"sunday",
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
	];
	const currentDayIndex = now.getDay();
	const currentDay = dayNames[currentDayIndex];
	const currentTime = now.toTimeString().slice(0, 5);

	const todaySchedule = workingHours.find(
		(wh) => wh.day.toLowerCase() === currentDay
	);

	if (!todaySchedule) {
		return false;
	}

	if (!todaySchedule.isOpen) {
		return false;
	}

	if (!todaySchedule.openTime || !todaySchedule.closeTime) {
		return true;
	}

	return (
		currentTime >= todaySchedule.openTime &&
		currentTime <= todaySchedule.closeTime
	);
};

/**
 * Helper method to convert degrees to radians
 */
const degreesToRadians = (degrees: number): number => {
	return degrees * (Math.PI / 180);
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
const calculateDistance = (
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number => {
	const R = 6371; // Earth's radius in kilometers
	const dLat = degreesToRadians(lat2 - lat1);
	const dLon = degreesToRadians(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(degreesToRadians(lat1)) *
			Math.cos(degreesToRadians(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

/**
 * Search categories by location and/or name
 * @route GET /api/categories/search
 * @access Public
 */
export const searchCategories = async (req: Request, res: Response) => {
	try {
		const { latitude, longitude, search, maxDistance } = req.query;

		// Build base query
		const query: any = {};

		// If search query is provided, filter by category name (case-insensitive)
		if (search && typeof search === "string" && search.trim()) {
			query.name = { $regex: search.trim(), $options: "i" };
		}

		// Fetch categories with populated admin data
		const categories = await categoryModel
			.find(query)
			.populate({
				path: "adminId",
				select: "name email location businessName businessPhone websiteUrl businessCoverImage _id workingHours",
				match: { isActive: true },
			})
			.lean();

		// Filter out categories where admin is not found or inactive
		let validCategories = categories.filter(
			(category) => category.adminId && category.adminId !== null
		);

		// If location coordinates are provided, filter by proximity
		if (latitude && longitude) {
			const userLat = parseFloat(latitude as string);
			const userLng = parseFloat(longitude as string);
			const maxDistKm = maxDistance
				? parseFloat(maxDistance as string)
				: undefined;

			// Validate coordinates
			if (isNaN(userLat) || isNaN(userLng)) {
				return res.status(400).json({
					success: false,
					message: "Invalid latitude or longitude",
				});
			}

			// Calculate distance for each category and filter
			const categoriesWithDistance = validCategories
				.map((category) => {
					const admin = category.adminId as any;
					const adminLat = admin?.location?.latitude;
					const adminLng = admin?.location?.longitude;

					// Skip if admin doesn't have location data
					if (!adminLat || !adminLng) {
						return null;
					}

					// Calculate distance
					const distance = calculateDistance(
						userLat,
						userLng,
						adminLat,
						adminLng
					);

					// Filter by maxDistance if provided
					if (maxDistKm && distance > maxDistKm) {
						return null;
					}

					// Destructure to exclude adminId and add admin with distance
					const { adminId, ...categoryData } = category;
					return {
						...categoryData,
						distance: parseFloat(distance.toFixed(2)), // Round to 2 decimal places
						admin: {
							_id: admin._id,
							name: admin.name,
							email: admin.email,
							location: admin.location,
							businessName: admin.businessName || null,
							businessPhone: admin.businessPhone || null,
							websiteUrl: admin.websiteUrl || null,
							businessCoverImage: admin.businessCoverImage || null,
							workingHours: admin.workingHours || null,
							isOpen: isStationCurrentlyOpen(admin.workingHours),
						},
					};
				})
				.filter((category) => category !== null) as any[];

			// Sort by distance (nearest first)
			categoriesWithDistance.sort((a, b) => a.distance - b.distance);

			return res.status(200).json({
				success: true,
				message: "Categories fetched successfully",
				data: categoriesWithDistance,
				count: categoriesWithDistance.length,
				userLocation: {
					latitude: userLat,
					longitude: userLng,
				},
			});
		} else {
			// No location provided, return all matching categories
			const formattedCategories = validCategories.map((category) => {
				const admin = category.adminId as any;
				// Destructure to exclude adminId and add admin
				const { adminId, ...categoryData } = category;
				return {
					...categoryData,
					admin: {
						_id: admin._id,
						name: admin.name,
						email: admin.email,
						location: admin.location,
						businessName: admin.businessName || null,
						businessPhone: admin.businessPhone || null,
						websiteUrl: admin.websiteUrl || null,
						businessCoverImage: admin.businessCoverImage || null,
						workingHours: admin.workingHours || null,
						isOpen: isStationCurrentlyOpen(admin.workingHours),
					},
				};
			});

			return res.status(200).json({
				success: true,
				message: "Categories fetched successfully",
				data: formattedCategories,
				count: formattedCategories.length,
			});
		}
	} catch (error) {
		console.error("Error searching categories:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

