const { body, param, query } = require('express-validator');

class ReviewValidator {
    // Validate review creation
    static createReview() {
        return [
            body('product_id')
                .isInt({ min: 1 })
                .withMessage('Valid product ID is required'),
            
            body('rating')
                .isInt({ min: 1, max: 5 })
                .withMessage('Rating must be between 1 and 5'),
            
            body('title')
                .optional()
                .trim()
                .isLength({ min: 1, max: 200 })
                .withMessage('Title must be between 1 and 200 characters'),
            
            body('comment')
                .optional()
                .trim()
                .isLength({ min: 1, max: 2000 })
                .withMessage('Comment must be between 1 and 2000 characters'),
            
            body('order_id')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Order ID must be a positive integer'),
            
            body('order_item_id')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Order item ID must be a positive integer'),
            
            body('images')
                .optional()
                .isArray()
                .withMessage('Images must be an array'),
            
            body('images.*')
                .optional()
                .isURL()
                .withMessage('Each image must be a valid URL')
        ];
    }

    // Validate review update
    static updateReview() {
        return [
            param('reviewId')
                .isInt({ min: 1 })
                .withMessage('Valid review ID is required'),
            
            body('rating')
                .optional()
                .isInt({ min: 1, max: 5 })
                .withMessage('Rating must be between 1 and 5'),
            
            body('title')
                .optional()
                .trim()
                .isLength({ min: 1, max: 200 })
                .withMessage('Title must be between 1 and 200 characters'),
            
            body('comment')
                .optional()
                .trim()
                .isLength({ min: 1, max: 2000 })
                .withMessage('Comment must be between 1 and 2000 characters'),
            
            body('images')
                .optional()
                .isArray()
                .withMessage('Images must be an array'),
            
            body('images.*')
                .optional()
                .isURL()
                .withMessage('Each image must be a valid URL')
        ];
    }

    // Validate get product reviews
    static getProductReviews() {
        return [
            param('productId')
                .isInt({ min: 1 })
                .withMessage('Valid product ID is required'),
            
            query('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            
            query('limit')
                .optional()
                .isInt({ min: 1, max: 50 })
                .withMessage('Limit must be between 1 and 50'),
            
            query('rating')
                .optional()
                .isInt({ min: 1, max: 5 })
                .withMessage('Rating filter must be between 1 and 5'),
            
            query('verified_only')
                .optional()
                .isBoolean()
                .withMessage('Verified only must be a boolean'),
            
            query('sort_by')
                .optional()
                .isIn(['created_at', 'rating', 'helpful_count'])
                .withMessage('Sort by must be: created_at, rating, or helpful_count'),
            
            query('sort_order')
                .optional()
                .isIn(['ASC', 'DESC'])
                .withMessage('Sort order must be ASC or DESC')
        ];
    }

    // Validate get user reviews
    static getUserReviews() {
        return [
            query('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            
            query('limit')
                .optional()
                .isInt({ min: 1, max: 50 })
                .withMessage('Limit must be between 1 and 50'),
            
            query('product_id')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Product ID must be a positive integer')
        ];
    }

    // Validate review ID parameter
    static reviewId() {
        return [
            param('reviewId')
                .isInt({ min: 1 })
                .withMessage('Valid review ID is required')
        ];
    }

    // Validate product ID parameter
    static productId() {
        return [
            param('productId')
                .isInt({ min: 1 })
                .withMessage('Valid product ID is required')
        ];
    }

    // Validate mark helpful
    static markHelpful() {
        return [
            param('reviewId')
                .isInt({ min: 1 })
                .withMessage('Valid review ID is required'),
            
            body('helpful')
                .isBoolean()
                .withMessage('Helpful must be a boolean value (true or false)')
        ];
    }
}

module.exports = ReviewValidator;
