const { body } = require('express-validator');

const orderValidation = {
    createOrder: [
        body('customer_name')
            .notEmpty()
            .withMessage('Customer name is required')
            .isLength({ min: 2, max: 255 })
            .withMessage('Customer name must be between 2 and 255 characters'),

        body('customer_email')
            .optional()
            .isEmail()
            .withMessage('Invalid email format'),

        body('customer_phone')
            .notEmpty()
            .withMessage('Customer phone is required')
            .matches(/^[0-9+\-\s()]{10,20}$/)
            .withMessage('Invalid phone number format'),

        body('shipping_name')
            .notEmpty()
            .withMessage('Shipping recipient name is required')
            .isLength({ min: 2, max: 255 })
            .withMessage('Shipping name must be between 2 and 255 characters'),

        body('shipping_phone')
            .notEmpty()
            .withMessage('Shipping phone is required')
            .matches(/^[0-9+\-\s()]{10,20}$/)
            .withMessage('Invalid shipping phone format'),

        body('shipping_address')
            .notEmpty()
            .withMessage('Shipping address is required')
            .isLength({ min: 10, max: 500 })
            .withMessage('Address must be between 10 and 500 characters'),

        body('shipping_city')
            .notEmpty()
            .withMessage('City is required')
            .isLength({ min: 2, max: 100 })
            .withMessage('City must be between 2 and 100 characters'),

        body('shipping_district')
            .optional()
            .isLength({ max: 100 })
            .withMessage('District cannot exceed 100 characters'),

        body('shipping_ward')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Ward cannot exceed 100 characters'),

        body('shipping_postal_code')
            .optional()
            .matches(/^[0-9]{5,10}$/)
            .withMessage('Postal code must be 5-10 digits'),

        body('shipping_method')
            .optional()
            .isIn(['standard', 'express', 'same_day'])
            .withMessage('Invalid shipping method'),

        body('payment_method')
            .optional()
            .isIn(['cod', 'bank_transfer', 'credit_card', 'e_wallet'])
            .withMessage('Invalid payment method'),

        body('notes')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Notes cannot exceed 500 characters')
    ],

    updateOrderStatus: [
        body('status')
            .notEmpty()
            .withMessage('Status is required')
            .isIn(['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'completed', 'cancelled'])
            .withMessage('Invalid order status'),

        body('notes')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Notes cannot exceed 500 characters')
    ],

    cancelOrder: [
        body('reason')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Cancellation reason cannot exceed 500 characters')
    ]
};

module.exports = orderValidation;