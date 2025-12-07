const { body, param, query } = require('express-validator');

const couponValidation = {
    validateApplyCoupon: [
        body('code')
            .notEmpty()
            .withMessage('Coupon code is required')
            .isLength({ min: 3, max: 50 })
            .withMessage('Coupon code must be between 3 and 50 characters')
            .matches(/^[A-Z0-9_-]+$/i)
            .withMessage('Coupon code can only contain letters, numbers, underscores, and hyphens'),

        body('order_amount')
            .notEmpty()
            .withMessage('Order amount is required')
            .isFloat({ min: 0 })
            .withMessage('Order amount must be a positive number'),

        body('order_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Order ID must be a positive integer')
    ],

    validateCouponCode: [
        param('code')
            .notEmpty()
            .withMessage('Coupon code is required')
            .isLength({ min: 3, max: 50 })
            .withMessage('Coupon code must be between 3 and 50 characters')
            .matches(/^[A-Z0-9_-]+$/i)
            .withMessage('Coupon code can only contain letters, numbers, underscores, and hyphens')
    ],

    validateOrderAmount: [
        query('order_amount')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Order amount must be a positive number')
    ],

    validatePagination: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),

        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ]
};

module.exports = couponValidation;