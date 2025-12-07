import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Rating from '../models/rating.model.js';
import User from '../models/user.model.js';
import Client from '../models/client.model.js';
import mongoose from 'mongoose';

export class RatingController {
    /**
     * Create default rating for a new admin/user
     */
    static async createDefaultRating(adminId: string) {
        try {
            // Check if rating already exists
            const existingRating = await Rating.findOne({ admin: adminId });
            if (existingRating) {
                return existingRating;
            }

            // Create new rating document
            const rating = new Rating({
                admin: adminId,
                averageRating: 0,
                reviews: []
            });

            await rating.save();
            return rating;
        } catch (error) {
            console.error('Create default rating error:', error);
            throw error;
        }
    }

    /**
     * Get rating by admin ID
     */
    static async getRatingByAdmin(req: Request, res: Response) {
        try {
            const { adminId } = req.params;

            if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid admin ID format'
                });
                return;
            }

            // TypeScript now knows adminId is defined after validation
            const validAdminId: string = adminId;
            const rating = await Rating.findOne({ admin: validAdminId })
                .populate('admin', 'name email businessName')
                .populate('reviews.client', 'fullName email');

            if (!rating) {
                // Create default rating if it doesn't exist
                const newRating = await RatingController.createDefaultRating(validAdminId);
                const populatedRating = await Rating.findById(newRating._id)
                    .populate('admin', 'name email businessName')
                    .populate('reviews.client', 'fullName email');

                res.json({
                    success: true,
                    data: { rating: populatedRating }
                });
                return;
            }

            res.json({
                success: true,
                data: { rating }
            });
        } catch (error) {
            console.error('Get rating by admin error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get all ratings (Admin only)
     */
    static async getAllRatings(req: Request, res: Response) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const ratings = await Rating.find()
                .populate('admin', 'name email businessName')
                .populate('reviews.client', 'fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));

            const total = await Rating.countDocuments();

            res.json({
                success: true,
                data: {
                    ratings,
                    pagination: {
                        current: Number(page),
                        pages: Math.ceil(total / Number(limit)),
                        total,
                        limit: Number(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get all ratings error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Add a review to a rating
     */
    static async addReview(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }

            const { adminId } = req.params;
            const { stars, comment, clientId } = req.body;

            if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid admin ID format'
                });
                return;
            }

            if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid client ID format'
                });
                return;
            }

            // Validate stars rating (1-5)
            if (!stars || typeof stars !== 'number' || stars < 1 || stars > 5) {
                res.status(400).json({
                    success: false,
                    message: 'Star rating is required and must be between 1 and 5'
                });
                return;
            }

            // TypeScript now knows these are defined after validation
            const validAdminId: string = adminId;
            const validClientId: string = clientId;

            // Verify admin exists
            const admin = await User.findById(validAdminId);
            if (!admin) {
                res.status(404).json({
                    success: false,
                    message: 'Admin not found'
                });
                return;
            }

            // Verify client exists
            const client = await Client.findById(validClientId);
            if (!client) {
                res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
                return;
            }

            // Find or create rating
            let rating = await Rating.findOne({ admin: validAdminId });
            if (!rating) {
                rating = await RatingController.createDefaultRating(validAdminId);
            }

            // Check if client already reviewed this admin
            const existingReview = rating.reviews.find(
                (review) => review.client.toString() === validClientId
            );

            if (existingReview) {
                res.status(409).json({
                    success: false,
                    message: 'You have already reviewed this admin'
                });
                return;
            }

            // Add new review
            rating.reviews.push({
                stars: Math.round(stars), // Ensure integer
                comment: comment || undefined,
                client: validClientId as any,
                createdAt: new Date()
            });

            // Calculate average rating from all reviews
            const totalStars = rating.reviews.reduce((sum, review) => sum + review.stars, 0);
            rating.averageRating = rating.reviews.length > 0 
                ? Math.round((totalStars / rating.reviews.length) * 10) / 10 // Round to 1 decimal place
                : 0;

            await rating.save();

            const populatedRating = await Rating.findById(rating._id)
                .populate('admin', 'name email businessName')
                .populate('reviews.client', 'fullName email');

            res.status(201).json({
                success: true,
                message: 'Review added successfully',
                data: { rating: populatedRating }
            });
        } catch (error) {
            console.error('Add review error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Update a review
     */
    static async updateReview(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }

            const { adminId, reviewId } = req.params;
            const { stars, comment } = req.body;

            if (!adminId || !reviewId) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid ID format'
                });
                return;
            }

            if (!mongoose.Types.ObjectId.isValid(adminId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid ID format'
                });
                return;
            }

            // TypeScript now knows these are defined after validation
            const validAdminId: string = adminId;
            const validReviewId: string = reviewId;

            const rating = await Rating.findOne({ admin: validAdminId });
            if (!rating) {
                res.status(404).json({
                    success: false,
                    message: 'Rating not found'
                });
                return;
            }

            const review = rating.reviews.find(
                (r) => (r as any)._id?.toString() === validReviewId
            );
            if (!review) {
                res.status(404).json({
                    success: false,
                    message: 'Review not found'
                });
                return;
            }

            // Update review stars and/or comment
            if (stars !== undefined) {
                if (typeof stars !== 'number' || stars < 1 || stars > 5) {
                    res.status(400).json({
                        success: false,
                        message: 'Star rating must be between 1 and 5'
                    });
                    return;
                }
                review.stars = Math.round(stars);
            }
            if (comment !== undefined) {
                review.comment = comment || undefined;
            }

            // Recalculate average rating
            const totalStars = rating.reviews.reduce((sum, r) => sum + r.stars, 0);
            rating.averageRating = rating.reviews.length > 0 
                ? Math.round((totalStars / rating.reviews.length) * 10) / 10
                : 0;

            await rating.save();

            const populatedRating = await Rating.findById(rating._id)
                .populate('admin', 'name email businessName')
                .populate('reviews.client', 'fullName email');

            res.json({
                success: true,
                message: 'Review updated successfully',
                data: { rating: populatedRating }
            });
        } catch (error) {
            console.error('Update review error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Delete a review
     */
    static async deleteReview(req: Request, res: Response) {
        try {
            const { adminId, reviewId } = req.params;

            if (!adminId || !reviewId) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid ID format'
                });
                return;
            }

            if (!mongoose.Types.ObjectId.isValid(adminId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid ID format'
                });
                return;
            }

            // TypeScript now knows these are defined after validation
            const validAdminId: string = adminId;
            const validReviewId: string = reviewId;

            const rating = await Rating.findOne({ admin: validAdminId });
            if (!rating) {
                res.status(404).json({
                    success: false,
                    message: 'Rating not found'
                });
                return;
            }

            const review = rating.reviews.find(
                (r) => (r as any)._id?.toString() === validReviewId
            );
            if (!review) {
                res.status(404).json({
                    success: false,
                    message: 'Review not found'
                });
                return;
            }

            // Remove review and recalculate average rating
            rating.reviews = rating.reviews.filter(
                (r) => (r as any)._id?.toString() !== validReviewId
            );
            
            // Recalculate average rating
            const totalStars = rating.reviews.reduce((sum, r) => sum + r.stars, 0);
            rating.averageRating = rating.reviews.length > 0 
                ? Math.round((totalStars / rating.reviews.length) * 10) / 10
                : 0;
            
            await rating.save();

            const populatedRating = await Rating.findById(rating._id)
                .populate('admin', 'name email businessName')
                .populate('reviews.client', 'fullName email');

            res.json({
                success: true,
                message: 'Review deleted successfully',
                data: { rating: populatedRating }
            });
        } catch (error) {
            console.error('Delete review error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get rating statistics
     */
    static async getRatingStats(req: Request, res: Response) {
        try {
            const totalRatings = await Rating.countDocuments();
            const totalReviews = await Rating.aggregate([
                {
                    $project: {
                        reviewCount: { $size: '$reviews' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$reviewCount' }
                    }
                }
            ]);

            const averageRating = await Rating.aggregate([
                {
                    $group: {
                        _id: null,
                        average: { $avg: '$averageRating' }
                    }
                }
            ]);

            res.json({
                success: true,
                data: {
                    totalRatings,
                    totalReviews: totalReviews[0]?.total || 0,
                    averageRating: averageRating[0]?.average || 0
                }
            });
        } catch (error) {
            console.error('Get rating stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

