const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const ReviewValidator = require('../validators/reviewValidator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

console.log('🔧 Setting up review routes...');

// Create a new review (requires authentication)
router.post('/',
    authenticateToken,
    ReviewValidator.createReview(),
    ReviewController.createReview
);

// Get reviews for a specific product (public)
router.get('/product/:productId',
    ReviewValidator.getProductReviews(),
    ReviewController.getProductReviews
);

// Get review statistics for a product (public)
router.get('/product/:productId/stats',
    ReviewValidator.productId(),
    ReviewController.getReviewStats
);

// Get current user's reviews (requires authentication)
router.get('/my-reviews',
    authenticateToken,
    ReviewValidator.getUserReviews(),
    ReviewController.getUserReviews
);

// Get a specific review by ID (public)
router.get('/:reviewId',
    ReviewValidator.reviewId(),
    ReviewController.getReview
);

// Update a review (requires authentication)
router.put('/:reviewId',
    authenticateToken,
    ReviewValidator.updateReview(),
    ReviewController.updateReview
);

// Delete a review (requires authentication)
router.delete('/:reviewId',
    authenticateToken,
    ReviewValidator.reviewId(),
    ReviewController.deleteReview
);

// Mark review as helpful/not helpful (public)
router.post('/:reviewId/helpful',
    ReviewValidator.markHelpful(),
    ReviewController.markHelpful
);

console.log('✅ Review routes configured successfully');

module.exports = router;
