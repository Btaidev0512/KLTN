const db = require('../config/database');

class Coupon {
    // Get coupon by code
    static async getCouponByCode(code) {
        try {
            const [coupons] = await db.execute(
                'SELECT * FROM coupons WHERE coupon_code = ? AND is_active = 1',
                [code]
            );

            if (coupons.length === 0) {
                return null;
            }

            return coupons[0];
        } catch (error) {
            throw new Error('Error fetching coupon: ' + error.message);
        }
    }

    // Validate coupon
    static async validateCoupon(code, orderAmount = 0, userId = null) {
        try {
            const coupon = await this.getCouponByCode(code);
            
            if (!coupon) {
                return {
                    valid: false,
                    message: 'Coupon not found or inactive',
                    coupon: null
                };
            }

            const now = new Date();
            const validFrom = new Date(coupon.valid_from);
            const validUntil = new Date(coupon.valid_until);

            // Check date validity
            if (now < validFrom) {
                return {
                    valid: false,
                    message: 'Coupon is not yet active',
                    coupon: coupon
                };
            }

            if (now > validUntil) {
                // Auto-disable coupon
                await db.execute(
                    'UPDATE coupons SET is_active = 0 WHERE coupon_id = ?',
                    [coupon.coupon_id]
                );
                
                return {
                    valid: false,
                    message: 'Coupon has expired',
                    coupon: coupon
                };
            }

            // Check minimum order amount
            if (coupon.minimum_order_amount && orderAmount < coupon.minimum_order_amount) {
                return {
                    valid: false,
                    message: `Minimum order amount is ${coupon.minimum_order_amount}đ`,
                    coupon: coupon
                };
            }

            // Check usage limit per coupon
            if (coupon.usage_limit_per_coupon && coupon.used_count >= coupon.usage_limit_per_coupon) {
                return {
                    valid: false,
                    message: 'Coupon usage limit exceeded',
                    coupon: coupon
                };
            }

            // Check usage limit per customer
            if (userId && coupon.usage_limit_per_customer) {
                const [userUsage] = await db.execute(
                    'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
                    [coupon.coupon_id, userId]
                );

                if (userUsage[0].count >= coupon.usage_limit_per_customer) {
                    return {
                        valid: false,
                        message: 'You have reached the usage limit for this coupon',
                        coupon: coupon
                    };
                }
            }

            return {
                valid: true,
                message: 'Coupon is valid',
                coupon: coupon
            };

        } catch (error) {
            throw new Error('Error validating coupon: ' + error.message);
        }
    }

    // Calculate discount amount
    static calculateDiscount(coupon, orderAmount) {
        let discountAmount = 0;

        if (coupon.discount_type === 'percentage') {
            discountAmount = (orderAmount * coupon.discount_value) / 100;
            
            // Apply maximum discount limit
            if (coupon.maximum_discount_amount && discountAmount > coupon.maximum_discount_amount) {
                discountAmount = coupon.maximum_discount_amount;
            }
        } else if (coupon.discount_type === 'fixed_amount') {
            discountAmount = coupon.discount_value;
            
            // Don't exceed order amount
            if (discountAmount > orderAmount) {
                discountAmount = orderAmount;
            }
        } else if (coupon.discount_type === 'free_shipping') {
            // For free shipping, discount is the shipping cost (assuming fixed 30000đ)
            discountAmount = Math.min(coupon.discount_value || 30000, orderAmount);
        }

        const finalAmount = orderAmount - discountAmount;

        return {
            originalAmount: orderAmount,
            discountAmount: discountAmount,
            finalAmount: Math.max(finalAmount, 0), // Ensure non-negative
            discountPercentage: orderAmount > 0 ? ((discountAmount / orderAmount) * 100).toFixed(2) : 0
        };
    }

    // Apply coupon to order
    static async applyCoupon(code, orderAmount, userId = null, orderId = null) {
        try {
            // Validate coupon
            const validation = await this.validateCoupon(code, orderAmount, userId);
            
            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.message,
                    data: null
                };
            }

            const coupon = validation.coupon;
            const discountCalculation = this.calculateDiscount(coupon, orderAmount);

            // Record usage (if coupon_usage table exists)
            try {
                await db.execute(`
                    INSERT INTO coupon_usage (
                        coupon_id, user_id, order_id, discount_amount, 
                        original_amount, final_amount
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    coupon.coupon_id, userId, orderId, discountCalculation.discountAmount,
                    discountCalculation.originalAmount, discountCalculation.finalAmount
                ]);
            } catch (error) {
                // If coupon_usage table doesn't exist, just log the error
                console.log('Note: coupon_usage table not found, skipping usage recording');
            }

            // Increment used count
            await db.execute(
                'UPDATE coupons SET used_count = COALESCE(used_count, 0) + 1 WHERE coupon_id = ?',
                [coupon.coupon_id]
            );

            return {
                success: true,
                message: 'Coupon applied successfully',
                data: {
                    coupon: {
                        code: coupon.coupon_code,
                        name: coupon.coupon_name,
                        description: coupon.description,
                        discount_type: coupon.discount_type,
                        discount_value: coupon.discount_value
                    },
                    calculation: discountCalculation
                }
            };

        } catch (error) {
            throw new Error('Error applying coupon: ' + error.message);
        }
    }

    // Get available coupons for user
    static async getAvailableCoupons(orderAmount = 0, userId = null) {
        try {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            let query = `
                SELECT 
                    coupon_id, coupon_code, coupon_name, description, discount_type, 
                    discount_value, minimum_order_amount, maximum_discount_amount,
                    usage_limit_per_coupon, usage_limit_per_customer, used_count, 
                    valid_from, valid_until
                FROM coupons 
                WHERE is_active = 1 
                AND valid_from <= ? 
                AND valid_until >= ?
                AND (usage_limit_per_coupon IS NULL OR COALESCE(used_count, 0) < usage_limit_per_coupon)
            `;
            
            const params = [now, now];
            
            // Filter by minimum order amount if provided
            if (orderAmount > 0) {
                query += ' AND (minimum_order_amount IS NULL OR minimum_order_amount <= ?)';
                params.push(orderAmount);
            }
            
            query += ' ORDER BY discount_value DESC';
            
            const [coupons] = await db.execute(query, params);

            // Filter out coupons that user has reached limit (if user provided)
            if (userId) {
                const filteredCoupons = [];
                
                for (const coupon of coupons) {
                    if (coupon.usage_limit_per_customer) {
                        try {
                            const [userUsage] = await db.execute(
                                'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
                                [coupon.coupon_id, userId]
                            );
                            
                            if (userUsage[0].count < coupon.usage_limit_per_customer) {
                                filteredCoupons.push(coupon);
                            }
                        } catch (error) {
                            // If coupon_usage table doesn't exist, include all coupons
                            filteredCoupons.push(coupon);
                        }
                    } else {
                        filteredCoupons.push(coupon);
                    }
                }
                
                return filteredCoupons;
            }

            return coupons;

        } catch (error) {
            throw new Error('Error fetching available coupons: ' + error.message);
        }
    }

    // Get coupon usage statistics
    static async getCouponStats(couponId) {
        try {
            const [stats] = await db.execute(`
                SELECT 
                    c.coupon_code, c.coupon_name, c.usage_limit_per_coupon, c.used_count,
                    COALESCE(c.used_count, 0) as total_usage
                FROM coupons c
                WHERE c.coupon_id = ?
            `, [couponId]);

            // Try to get detailed stats from coupon_usage table if it exists
            try {
                const [detailedStats] = await db.execute(`
                    SELECT 
                        COUNT(cu.usage_id) as actual_usage,
                        SUM(cu.discount_amount) as total_discount_given,
                        AVG(cu.discount_amount) as avg_discount_per_use,
                        MIN(cu.used_at) as first_used,
                        MAX(cu.used_at) as last_used
                    FROM coupon_usage cu
                    WHERE cu.coupon_id = ?
                `, [couponId]);

                if (stats[0] && detailedStats[0]) {
                    return {
                        ...stats[0],
                        ...detailedStats[0]
                    };
                }
            } catch (error) {
                // coupon_usage table doesn't exist, return basic stats
            }

            return stats[0] || null;

        } catch (error) {
            throw new Error('Error fetching coupon stats: ' + error.message);
        }
    }

    // Get user coupon usage history
    static async getUserCouponHistory(userId, limit = 10, offset = 0) {
        try {
            const [history] = await db.execute(`
                SELECT 
                    cu.usage_id, cu.discount_amount, cu.original_amount, 
                    cu.final_amount, cu.used_at, cu.order_id,
                    c.coupon_code, c.coupon_name, c.discount_type, c.discount_value
                FROM coupon_usage cu
                JOIN coupons c ON cu.coupon_id = c.coupon_id
                WHERE cu.user_id = ?
                ORDER BY cu.used_at DESC
                LIMIT ? OFFSET ?
            `, [userId, limit, offset]);

            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM coupon_usage WHERE user_id = ?',
                [userId]
            );

            return {
                history,
                total: countResult[0].total,
                limit,
                offset
            };

        } catch (error) {
            // If coupon_usage table doesn't exist, return empty history
            return {
                history: [],
                total: 0,
                limit,
                offset
            };
        }
    }
}

module.exports = Coupon;