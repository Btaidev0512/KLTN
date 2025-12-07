const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET all coupons (with pagination and filters)
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            discount_type,
            search 
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let params = [];

        // Filter by status (active/inactive)
        if (status === 'active') {
            whereConditions.push('is_active = 1');
        } else if (status === 'inactive') {
            whereConditions.push('is_active = 0');
        }

        // Filter by discount type
        if (discount_type) {
            whereConditions.push('discount_type = ?');
            params.push(discount_type);
        }

        // Search by code or name
        if (search) {
            whereConditions.push('(coupon_code LIKE ? OR coupon_name LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        // Get total count
        const [countResult] = await db.execute(
            `SELECT COUNT(*) as total FROM coupons ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Get coupons with pagination
        const [coupons] = await db.execute(
            `SELECT 
                coupon_id, coupon_code, coupon_name, description,
                discount_type, discount_value, 
                minimum_order_amount, maximum_discount_amount,
                usage_limit_per_coupon, usage_limit_per_customer,
                used_count, valid_from, valid_until, is_active,
                created_at, updated_at
            FROM coupons 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            message: 'Coupons retrieved successfully',
            data: {
                coupons,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching coupons',
            error: error.message
        });
    }
});

// GET coupon by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [coupons] = await db.execute(
            `SELECT * FROM coupons WHERE coupon_id = ?`,
            [id]
        );

        if (coupons.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon retrieved successfully',
            data: coupons[0]
        });

    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching coupon',
            error: error.message
        });
    }
});

// POST create new coupon
router.post('/', async (req, res) => {
    try {
        const {
            coupon_code,
            coupon_name,
            description,
            discount_type,
            discount_value,
            minimum_order_amount,
            maximum_discount_amount,
            usage_limit_per_coupon,
            usage_limit_per_customer,
            valid_from,
            valid_until,
            is_active
        } = req.body;

        // Validation
        if (!coupon_code || !coupon_name || !discount_type || !discount_value) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: coupon_code, coupon_name, discount_type, discount_value'
            });
        }

        // Validate coupon code format
        if (!/^[A-Z0-9_-]+$/i.test(coupon_code)) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code can only contain letters, numbers, underscores, and hyphens'
            });
        }

        // Check if coupon code already exists
        const [existing] = await db.execute(
            'SELECT coupon_id FROM coupons WHERE coupon_code = ?',
            [coupon_code]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        // Validate discount type
        if (!['percentage', 'fixed_amount', 'free_shipping'].includes(discount_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid discount_type. Must be: percentage, fixed_amount, or free_shipping'
            });
        }

        // Insert new coupon
        const [result] = await db.execute(
            `INSERT INTO coupons (
                coupon_code, coupon_name, description,
                discount_type, discount_value,
                minimum_order_amount, maximum_discount_amount,
                usage_limit_per_coupon, usage_limit_per_customer,
                valid_from, valid_until, is_active, used_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
                coupon_code.toUpperCase(),
                coupon_name,
                description || null,
                discount_type,
                discount_value,
                minimum_order_amount || 0,
                maximum_discount_amount || null,
                usage_limit_per_coupon || null,
                usage_limit_per_customer || null,
                valid_from || new Date(),
                valid_until,
                is_active !== undefined ? is_active : 1
            ]
        );

        // Fetch the created coupon
        const [newCoupon] = await db.execute(
            'SELECT * FROM coupons WHERE coupon_id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: newCoupon[0]
        });

    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating coupon',
            error: error.message
        });
    }
});

// PUT update coupon
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            coupon_code,
            coupon_name,
            description,
            discount_type,
            discount_value,
            minimum_order_amount,
            maximum_discount_amount,
            usage_limit_per_coupon,
            usage_limit_per_customer,
            valid_from,
            valid_until,
            is_active
        } = req.body;

        // Check if coupon exists
        const [existing] = await db.execute(
            'SELECT coupon_id FROM coupons WHERE coupon_id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // If updating coupon_code, check for duplicates
        if (coupon_code) {
            const [duplicate] = await db.execute(
                'SELECT coupon_id FROM coupons WHERE coupon_code = ? AND coupon_id != ?',
                [coupon_code, id]
            );

            if (duplicate.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon code already exists'
                });
            }
        }

        // Build update query dynamically
        let updateFields = [];
        let params = [];

        if (coupon_code !== undefined) {
            updateFields.push('coupon_code = ?');
            params.push(coupon_code.toUpperCase());
        }
        if (coupon_name !== undefined) {
            updateFields.push('coupon_name = ?');
            params.push(coupon_name);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            params.push(description);
        }
        if (discount_type !== undefined) {
            updateFields.push('discount_type = ?');
            params.push(discount_type);
        }
        if (discount_value !== undefined) {
            updateFields.push('discount_value = ?');
            params.push(discount_value);
        }
        if (minimum_order_amount !== undefined) {
            updateFields.push('minimum_order_amount = ?');
            params.push(minimum_order_amount);
        }
        if (maximum_discount_amount !== undefined) {
            updateFields.push('maximum_discount_amount = ?');
            params.push(maximum_discount_amount);
        }
        if (usage_limit_per_coupon !== undefined) {
            updateFields.push('usage_limit_per_coupon = ?');
            params.push(usage_limit_per_coupon);
        }
        if (usage_limit_per_customer !== undefined) {
            updateFields.push('usage_limit_per_customer = ?');
            params.push(usage_limit_per_customer);
        }
        if (valid_from !== undefined) {
            updateFields.push('valid_from = ?');
            params.push(valid_from);
        }
        if (valid_until !== undefined) {
            updateFields.push('valid_until = ?');
            params.push(valid_until);
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            params.push(is_active);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push('updated_at = NOW()');
        params.push(id);

        await db.execute(
            `UPDATE coupons SET ${updateFields.join(', ')} WHERE coupon_id = ?`,
            params
        );

        // Fetch updated coupon
        const [updatedCoupon] = await db.execute(
            'SELECT * FROM coupons WHERE coupon_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Coupon updated successfully',
            data: updatedCoupon[0]
        });

    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating coupon',
            error: error.message
        });
    }
});

// DELETE coupon
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if coupon exists
        const [existing] = await db.execute(
            'SELECT coupon_id, used_count FROM coupons WHERE coupon_id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Check if coupon has been used
        if (existing[0].used_count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete coupon that has been used. Consider deactivating it instead.'
            });
        }

        // Delete the coupon
        await db.execute(
            'DELETE FROM coupons WHERE coupon_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting coupon',
            error: error.message
        });
    }
});

// PATCH toggle coupon active status
router.patch('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if coupon exists
        const [existing] = await db.execute(
            'SELECT coupon_id, is_active FROM coupons WHERE coupon_id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        const newStatus = existing[0].is_active === 1 ? 0 : 1;

        await db.execute(
            'UPDATE coupons SET is_active = ?, updated_at = NOW() WHERE coupon_id = ?',
            [newStatus, id]
        );

        res.json({
            success: true,
            message: `Coupon ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
            data: { is_active: newStatus }
        });

    } catch (error) {
        console.error('Error toggling coupon status:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling coupon status',
            error: error.message
        });
    }
});

// GET coupon statistics
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;

        const [stats] = await db.execute(`
            SELECT 
                c.coupon_code, c.coupon_name, 
                c.usage_limit_per_coupon, 
                c.used_count,
                COALESCE(c.used_count, 0) as total_usage,
                CASE 
                    WHEN c.usage_limit_per_coupon IS NOT NULL 
                    THEN ((COALESCE(c.used_count, 0) / c.usage_limit_per_coupon) * 100)
                    ELSE NULL
                END as usage_percentage
            FROM coupons c
            WHERE c.coupon_id = ?
        `, [id]);

        if (stats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon statistics retrieved successfully',
            data: stats[0]
        });

    } catch (error) {
        console.error('Error fetching coupon stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching coupon stats',
            error: error.message
        });
    }
});

module.exports = router;
