const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const couponValidation = require('../validators/couponValidator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Quick check if coupon exists (public)
router.get('/check/:code', 
    couponValidation.validateCouponCode,
    couponController.quickCheck
);

// Validate coupon (public, but better with auth for user-specific validation)
router.get('/validate/:code', 
    couponValidation.validateCouponCode,
    couponValidation.validateOrderAmount,
    optionalAuth, // Optional authentication
    couponController.validateCoupon
);

// Apply coupon to order (requires authentication)
router.post('/apply', 
    authenticateToken,
    couponValidation.validateApplyCoupon,
    couponController.applyCoupon
);

// Get available coupons (public, but better with auth for personalization)
router.get('/available', 
    couponValidation.validateOrderAmount,
    optionalAuth, // Optional authentication
    couponController.getAvailableCoupons
);

// Get user's coupon usage history (requires authentication)
router.get('/history', 
    authenticateToken,
    couponValidation.validatePagination,
    couponController.getUserCouponHistory
);

// Get coupon statistics (admin only - for now public for testing)
router.get('/stats/:couponId', 
    couponController.getCouponStats
);

module.exports = router;