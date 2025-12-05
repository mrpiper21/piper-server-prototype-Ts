import { Router } from 'express';
import { RatingController } from '../controllers/rating.controller.js';
import { AuthController } from '../controllers/auth.controller.js';
import { body } from 'express-validator';

const router = Router();

// Validation middleware
const validateAddReview = [
    body('stars')
        .notEmpty()
        .withMessage('Star rating is required')
        .isInt({ min: 1, max: 5 })
        .withMessage('Star rating must be between 1 and 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ min: 3, max: 500 })
        .withMessage('Comment must be between 3 and 500 characters if provided'),
    body('clientId')
        .notEmpty()
        .withMessage('Client ID is required')
        .isMongoId()
        .withMessage('Invalid client ID format')
];

const validateUpdateReview = [
    body('stars')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Star rating must be between 1 and 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ min: 3, max: 500 })
        .withMessage('Comment must be between 3 and 500 characters if provided')
];

/**
 * @route   GET /api/ratings
 * @desc    Get all ratings (paginated)
 * @access  Private (Admin)
 */
router.get(
    '/',
    AuthController.verifyToken,
    RatingController.getAllRatings
);

/**
 * @route   GET /api/ratings/stats
 * @desc    Get rating statistics
 * @access  Private (Admin)
 */
router.get(
    '/stats',
    AuthController.verifyToken,
    RatingController.getRatingStats
);

/**
 * @route   GET /api/ratings/admin/:adminId
 * @desc    Get rating by admin ID
 * @access  Public (or Private based on your needs)
 */
router.get(
    '/admin/:adminId',
    RatingController.getRatingByAdmin
);

/**
 * @route   POST /api/ratings/admin/:adminId/reviews
 * @desc    Add a review to an admin's rating
 * @access  Private (Authenticated users)
 */
router.post(
    '/admin/:adminId/reviews',
    AuthController.verifyToken,
    validateAddReview,
    RatingController.addReview
);

/**
 * @route   PUT /api/ratings/admin/:adminId/reviews/:reviewId
 * @desc    Update a review
 * @access  Private (Review owner or Admin)
 */
router.put(
    '/admin/:adminId/reviews/:reviewId',
    AuthController.verifyToken,
    validateUpdateReview,
    RatingController.updateReview
);

/**
 * @route   DELETE /api/ratings/admin/:adminId/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private (Review owner or Admin)
 */
router.delete(
    '/admin/:adminId/reviews/:reviewId',
    AuthController.verifyToken,
    RatingController.deleteReview
);

export default router;

