const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const paymentValidation = require('../validators/paymentValidator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Create payment (for VNPay, MoMo, etc.)
router.post('/create', 
    optionalAuth,
    paymentController.createPayment
);

// Verify payment callback
router.post('/verify', 
    paymentController.verifyPayment
);

// VNPay specific routes
router.post('/vnpay/create', 
    authenticateToken,
    paymentController.createVNPayPayment
);

router.get('/vnpay/callback', paymentController.vnpayCallback);
router.post('/vnpay/ipn', paymentController.vnpayIPN);

// MoMo specific routes
router.post('/momo/create', 
    authenticateToken,
    paymentController.createMoMoPayment
);

router.post('/momo/callback', paymentController.momoCallback);
router.post('/momo/ipn', paymentController.momoIPN);

// Get payment status
router.get('/:paymentId/status', 
    optionalAuth,
    paymentController.getPaymentStatus
);

// Get payment history
router.get('/history', 
    authenticateToken,
    paymentController.getPaymentHistory
);

module.exports = router;