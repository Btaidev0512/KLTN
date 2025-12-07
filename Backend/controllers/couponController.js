const Coupon = require('../models/Coupon');
const { validationResult } = require('express-validator');

const couponController = {
    // Validate coupon code
    validateCoupon: async (req, res) => {
        try {
            const { code } = req.params;
            const { order_amount } = req.query;
            const userId = req.user ? req.user.user_id : null;

            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon code is required'
                });
            }

            const orderAmount = parseFloat(order_amount) || 0;
            const validation = await Coupon.validateCoupon(code, orderAmount, userId);

            if (validation.valid) {
                const discountCalculation = Coupon.calculateDiscount(validation.coupon, orderAmount);
                
                res.json({
                    success: true,
                    message: validation.message,
                    data: {
                        coupon: {
                            code: validation.coupon.coupon_code,
                            name: validation.coupon.coupon_name,
                            description: validation.coupon.description,
                            discount_type: validation.coupon.discount_type,
                            discount_value: validation.coupon.discount_value,
                            minimum_order_amount: validation.coupon.minimum_order_amount,
                            maximum_discount_amount: validation.coupon.maximum_discount_amount
                        },
                        calculation: discountCalculation,
                        valid: true
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: validation.message,
                    data: {
                        valid: false,
                        coupon: validation.coupon ? {
                            code: validation.coupon.coupon_code,
                            name: validation.coupon.coupon_name,
                            minimum_order_amount: validation.coupon.minimum_order_amount
                        } : null
                    }
                });
            }

        } catch (error) {
            console.error('Error validating coupon:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Apply coupon to order
    applyCoupon: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { code, order_amount, order_id } = req.body;
            const userId = req.user ? req.user.user_id : null;

            const result = await Coupon.applyCoupon(code, order_amount, userId, order_id);

            if (result.success) {
                res.json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }

        } catch (error) {
            console.error('Error applying coupon:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get available coupons
    getAvailableCoupons: async (req, res) => {
        try {
            const { order_amount } = req.query;
            const userId = req.user ? req.user.user_id : null;
            const orderAmount = parseFloat(order_amount) || 0;

            const coupons = await Coupon.getAvailableCoupons(orderAmount, userId);

            // Add discount calculation preview for each coupon
            const couponsWithPreview = coupons.map(coupon => {
                let discountPreview = null;
                
                if (orderAmount > 0 && orderAmount >= (coupon.minimum_order_amount || 0)) {
                    discountPreview = Coupon.calculateDiscount(coupon, orderAmount);
                }

                return {
                    code: coupon.coupon_code,
                    name: coupon.coupon_name,
                    description: coupon.description,
                    discount_type: coupon.discount_type,
                    discount_value: coupon.discount_value,
                    minimum_order_amount: coupon.minimum_order_amount,
                    maximum_discount_amount: coupon.maximum_discount_amount,
                    usage_limit: coupon.usage_limit_per_coupon,
                    used_count: coupon.used_count,
                    valid_from: coupon.valid_from,
                    valid_until: coupon.valid_until,
                    discount_preview: discountPreview
                };
            });

            res.json({
                success: true,
                message: 'Available coupons retrieved successfully',
                data: {
                    coupons: couponsWithPreview,
                    total: couponsWithPreview.length,
                    order_amount: orderAmount
                }
            });

        } catch (error) {
            console.error('Error fetching available coupons:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get coupon usage statistics
    getCouponStats: async (req, res) => {
        try {
            const { couponId } = req.params;

            if (!couponId || isNaN(couponId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid coupon ID is required'
                });
            }

            const stats = await Coupon.getCouponStats(parseInt(couponId));

            if (!stats) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found'
                });
            }

            res.json({
                success: true,
                message: 'Coupon statistics retrieved successfully',
                data: stats
            });

        } catch (error) {
            console.error('Error fetching coupon stats:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get user coupon history
    getUserCouponHistory: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const result = await Coupon.getUserCouponHistory(userId, limit, offset);

            res.json({
                success: true,
                message: 'Coupon history retrieved successfully',
                data: {
                    history: result.history,
                    total: result.total,
                    page,
                    limit,
                    total_pages: Math.ceil(result.total / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching user coupon history:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Quick check if coupon exists (for real-time validation)
    quickCheck: async (req, res) => {
        try {
            const { code } = req.params;
            
            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon code is required'
                });
            }

            const coupon = await Coupon.getCouponByCode(code);
            
            if (coupon) {
                const now = new Date();
                const validUntil = new Date(coupon.valid_until);
                const isExpired = now > validUntil;
                
                res.json({
                    success: true,
                    data: {
                        exists: true,
                        name: coupon.coupon_name,
                        discount_type: coupon.discount_type,
                        discount_value: coupon.discount_value,
                        minimum_order_amount: coupon.minimum_order_amount,
                        expired: isExpired,
                        valid_until: coupon.valid_until
                    }
                });
            } else {
                res.json({
                    success: true,
                    data: {
                        exists: false
                    }
                });
            }

        } catch (error) {
            console.error('Error in quick check:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = couponController;