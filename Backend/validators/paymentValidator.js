const { body, param, query } = require('express-validator');

// VNPay payment creation validation
const createVNPayPayment = [
    body('order_id')
        .notEmpty()
        .withMessage('Order ID is required')
        .isLength({ max: 100 })
        .withMessage('Order ID must be less than 100 characters'),
    
    body('amount')
        .isFloat({ min: 1000 })
        .withMessage('Amount must be at least 1,000 VND')
        .isFloat({ max: 100000000 })
        .withMessage('Amount must be less than 100,000,000 VND'),
    
    body('order_info')
        .notEmpty()
        .withMessage('Order information is required')
        .isLength({ max: 255 })
        .withMessage('Order information must be less than 255 characters'),
    
    body('return_url')
        .isURL()
        .withMessage('Return URL must be a valid URL'),
    
    body('cancel_url')
        .optional()
        .isURL()
        .withMessage('Cancel URL must be a valid URL')
];

// MoMo payment creation validation
const createMoMoPayment = [
    body('order_id')
        .notEmpty()
        .withMessage('Order ID is required')
        .isLength({ max: 100 })
        .withMessage('Order ID must be less than 100 characters'),
    
    body('amount')
        .isFloat({ min: 1000 })
        .withMessage('Amount must be at least 1,000 VND')
        .isFloat({ max: 50000000 })
        .withMessage('Amount must be less than 50,000,000 VND'),
    
    body('order_info')
        .notEmpty()
        .withMessage('Order information is required')
        .isLength({ max: 255 })
        .withMessage('Order information must be less than 255 characters'),
    
    body('return_url')
        .isURL()
        .withMessage('Return URL must be a valid URL'),
    
    body('notify_url')
        .isURL()
        .withMessage('Notify URL must be a valid URL')
];

// Payment verification validation
const verifyPayment = [
    body('payment_id')
        .notEmpty()
        .withMessage('Payment ID is required')
        .isInt({ min: 1 })
        .withMessage('Payment ID must be a valid integer'),
    
    body('gateway_transaction_id')
        .notEmpty()
        .withMessage('Gateway transaction ID is required')
        .isLength({ max: 255 })
        .withMessage('Gateway transaction ID must be less than 255 characters'),
    
    body('status')
        .isIn(['completed', 'failed', 'cancelled'])
        .withMessage('Status must be completed, failed, or cancelled')
];

// Payment status update validation  
const updatePaymentStatus = [
    param('payment_id')
        .isInt({ min: 1 })
        .withMessage('Payment ID must be a valid integer'),
    
    body('status')
        .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])
        .withMessage('Status must be one of: pending, processing, completed, failed, cancelled, refunded'),
    
    body('gateway_response')
        .optional()
        .isObject()
        .withMessage('Gateway response must be an object'),
    
    body('paid_at')
        .optional()
        .isISO8601()
        .withMessage('Paid at must be a valid ISO8601 date')
];

// Get payments validation
const getPayments = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('status')
        .optional()
        .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])
        .withMessage('Status must be one of: pending, processing, completed, failed, cancelled, refunded'),
    
    query('payment_method')
        .optional()
        .isIn(['vnpay', 'momo', 'bank_transfer', 'cash', 'card'])
        .withMessage('Payment method must be one of: vnpay, momo, bank_transfer, cash, card'),
    
    query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO8601 date'),
    
    query('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO8601 date'),
    
    query('sort_by')
        .optional()
        .isIn(['created_at', 'amount', 'status', 'payment_method'])
        .withMessage('Sort by must be one of: created_at, amount, status, payment_method'),
    
    query('sort_order')
        .optional()
        .isIn(['ASC', 'DESC'])
        .withMessage('Sort order must be ASC or DESC')
];

// Payment ID parameter validation
const paymentIdParam = [
    param('payment_id')
        .isInt({ min: 1 })
        .withMessage('Payment ID must be a valid positive integer')
];

// Order ID parameter validation
const orderIdParam = [
    param('order_id')
        .notEmpty()
        .withMessage('Order ID is required')
        .isLength({ max: 100 })
        .withMessage('Order ID must be less than 100 characters')
];

// Refund validation
const createRefund = [
    body('payment_id')
        .isInt({ min: 1 })
        .withMessage('Payment ID must be a valid integer'),
    
    body('amount')
        .optional()
        .isFloat({ min: 1000 })
        .withMessage('Refund amount must be at least 1,000 VND'),
    
    body('reason')
        .notEmpty()
        .withMessage('Refund reason is required')
        .isLength({ max: 500 })
        .withMessage('Refund reason must be less than 500 characters'),
    
    body('refund_type')
        .isIn(['partial', 'full'])
        .withMessage('Refund type must be partial or full')
];

module.exports = {
    createVNPayPayment,
    createMoMoPayment,
    verifyPayment,
    updatePaymentStatus,
    getPayments,
    paymentIdParam,
    orderIdParam,
    createRefund
};