const { body } = require('express-validator');

const cartValidation = {
    addToCart: [
        body('product_id')
            .exists()
            .withMessage('Product ID is required')
            .notEmpty()
            .withMessage('Product ID cannot be empty')
            .isInt({ min: 1 })
            .withMessage('Product ID must be a positive integer')
            .toInt(),

        body('quantity')
            .optional()
            .isInt({ min: 1, max: 99 })
            .withMessage('Quantity must be between 1 and 99')
            .toInt(),

        body('selected_attributes')
            .optional()
            .isObject()
            .withMessage('Selected attributes must be an object'),

        body('selected_attributes.size')
            .optional()
            .notEmpty()
            .withMessage('Size cannot be empty if provided')
            .trim(),

        body('selected_attributes.color')
            .optional()
            .notEmpty()
            .withMessage('Color cannot be empty if provided')
            .trim()
    ],

    updateCart: [
        body('quantity')
            .notEmpty()
            .withMessage('Quantity is required')
            .isInt({ min: 0, max: 99 })
            .withMessage('Quantity must be between 0 and 99')
    ],

    applyCoupon: [
        body('coupon_code')
            .notEmpty()
            .withMessage('Coupon code is required')
            .isString()
            .withMessage('Coupon code must be a string')
            .isLength({ min: 3, max: 50 })
            .withMessage('Coupon code must be between 3 and 50 characters')
            .trim()
    ],

    checkout: [
        body('customer_name')
            .notEmpty()
            .withMessage('Customer name is required')
            .isLength({ min: 2, max: 100 })
            .withMessage('Customer name must be between 2 and 100 characters')
            .trim(),

        body('customer_email')
            .notEmpty()
            .withMessage('Customer email is required')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),

        body('customer_phone')
            .notEmpty()
            .withMessage('Customer phone is required')
            .matches(/^[0-9+\-\s()]{10,15}$/)
            .withMessage('Please provide a valid phone number'),

        body('billing_address')
            .notEmpty()
            .withMessage('Billing address is required')
            .isObject()
            .withMessage('Billing address must be an object'),

        body('billing_address.street')
            .notEmpty()
            .withMessage('Street address is required')
            .isLength({ max: 255 })
            .withMessage('Street address is too long'),

        body('billing_address.city')
            .notEmpty()
            .withMessage('City is required')
            .isLength({ max: 50 })
            .withMessage('City name is too long'),

        body('billing_address.postal_code')
            .notEmpty()
            .withMessage('Postal code is required')
            .isLength({ max: 20 })
            .withMessage('Postal code is too long'),

        body('shipping_address')
            .optional()
            .isObject()
            .withMessage('Shipping address must be an object'),

        body('payment_method')
            .optional()
            .isIn(['cod', 'bank_transfer', 'credit_card', 'paypal'])
            .withMessage('Invalid payment method'),

        body('coupon_code')
            .optional()
            .isString()
            .withMessage('Coupon code must be a string')
            .isLength({ min: 3, max: 50 })
            .withMessage('Coupon code must be between 3 and 50 characters')
            .trim(),

        body('notes')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Notes cannot exceed 500 characters')
            .trim()
    ]
};

module.exports = cartValidation;