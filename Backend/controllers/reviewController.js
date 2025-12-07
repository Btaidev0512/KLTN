const Review = require('../models/Review');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

class ReviewController {
    // Create a new review
    static async createReview(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const userId = req.user ? req.user.user_id : null;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required to create review'
                });
            }

            const {
                product_id,
                order_id,
                order_item_id,
                rating,
                title,
                comment,
                images
            } = req.body;

            console.log('🌟 Creating review request:', { 
                userId, product_id, rating, title, order_id 
            });

            // Check if product exists
            const product = await Product.getById(product_id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            const reviewData = {
                user_id: userId,
                product_id,
                order_id,
                order_item_id,
                rating,
                title,
                comment,
                images
            };

            const review = await Review.create(reviewData);

            res.status(201).json({
                success: true,
                message: 'Review created successfully',
                data: {
                    review
                }
            });

        } catch (error) {
            console.error('❌ Error in createReview:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get reviews for a product
    static async getProductReviews(req, res) {
        try {
            const { productId } = req.params;
            const {
                page = 1,
                limit = 10,
                rating,
                verified_only,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = req.query;

            console.log(`📋 Getting reviews for product ${productId}`, {
                page, limit, rating, verified_only
            });

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                rating: rating ? parseInt(rating) : null,
                verified_only: verified_only === 'true',
                sort_by,
                sort_order
            };

            const result = await Review.getProductReviews(productId, options);

            // Also get review statistics
            const stats = await Review.getReviewStats(productId);

            res.status(200).json({
                success: true,
                message: 'Product reviews retrieved successfully',
                data: {
                    ...result,
                    statistics: stats
                }
            });

        } catch (error) {
            console.error('❌ Error in getProductReviews:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get user's reviews
    static async getUserReviews(req, res) {
        try {
            const userId = req.user ? req.user.user_id : null;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const {
                page = 1,
                limit = 10,
                product_id
            } = req.query;

            console.log(`👤 Getting reviews for user ${userId}`);

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                product_id: product_id ? parseInt(product_id) : null
            };

            const result = await Review.getUserReviews(userId, options);

            res.status(200).json({
                success: true,
                message: 'User reviews retrieved successfully',
                data: result
            });

        } catch (error) {
            console.error('❌ Error in getUserReviews:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get a specific review
    static async getReview(req, res) {
        try {
            const { reviewId } = req.params;

            const review = await Review.getById(reviewId);

            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Review retrieved successfully',
                data: {
                    review
                }
            });

        } catch (error) {
            console.error('❌ Error in getReview:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update a review
    static async updateReview(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const userId = req.user ? req.user.user_id : null;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const { reviewId } = req.params;
            const {
                rating,
                title,
                comment,
                images
            } = req.body;

            console.log(`✏️ Updating review ${reviewId} by user ${userId}`);

            const updateData = {
                rating,
                title,
                comment,
                images
            };

            const review = await Review.update(reviewId, updateData, userId);

            res.status(200).json({
                success: true,
                message: 'Review updated successfully',
                data: {
                    review
                }
            });

        } catch (error) {
            console.error('❌ Error in updateReview:', error.message);
            
            if (error.message.includes('not found') || error.message.includes('access denied')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Delete a review
    static async deleteReview(req, res) {
        try {
            const userId = req.user ? req.user.user_id : null;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const { reviewId } = req.params;

            console.log(`🗑️ Deleting review ${reviewId} by user ${userId}`);

            const result = await Review.delete(reviewId, userId);

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            console.error('❌ Error in deleteReview:', error.message);
            
            if (error.message.includes('not found') || error.message.includes('access denied')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Mark review as helpful
    static async markHelpful(req, res) {
        try {
            const { reviewId } = req.params;
            const { helpful } = req.body; // true for helpful, false for not helpful

            console.log(`👍 Marking review ${reviewId} as ${helpful ? 'helpful' : 'not helpful'}`);

            const review = await Review.markHelpful(reviewId, helpful === true);

            res.status(200).json({
                success: true,
                message: `Review marked as ${helpful ? 'helpful' : 'not helpful'}`,
                data: {
                    review
                }
            });

        } catch (error) {
            console.error('❌ Error in markHelpful:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get review statistics for a product
    static async getReviewStats(req, res) {
        try {
            const { productId } = req.params;

            console.log(`📊 Getting review stats for product ${productId}`);

            const stats = await Review.getReviewStats(productId);

            res.status(200).json({
                success: true,
                message: 'Review statistics retrieved successfully',
                data: {
                    statistics: stats
                }
            });

        } catch (error) {
            console.error('❌ Error in getReviewStats:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = ReviewController;
