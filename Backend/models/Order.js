const db = require('../config/database');

class Order {
    static async getById(orderId, userId = null) {
        try {
            // Get order details
            let query = `
                SELECT 
                    o.order_id,
                    o.order_number,
                    o.user_id,
                    o.total_amount,
                    o.status,
                    o.payment_method,
                    o.payment_status,
                    o.shipping_full_name,
                    o.customer_email,
                    o.customer_phone,
                    o.shipping_address_line_1,
                    o.shipping_address_line_2,
                    o.shipping_city,
                    o.shipping_state,
                    o.shipping_postal_code,
                    o.shipping_country,
                    o.notes,
                    o.created_at,
                    o.updated_at
                FROM orders o
                WHERE o.order_id = ?
            `;
            
            const params = [orderId];
            
            // If userId is provided, verify ownership
            if (userId) {
                query += ` AND o.user_id = ?`;
                params.push(userId);
            }

            const [orders] = await db.pool.query(query, params);

            if (orders.length === 0) {
                return null;
            }

            const order = orders[0];

            // Get order items with product details
            const [items] = await db.pool.query(`
                SELECT 
                    oi.order_item_id,
                    oi.product_id,
                    oi.product_name,
                    oi.quantity,
                    oi.unit_price,
                    oi.unit_price as price,
                    oi.total_price,
                    oi.total_price as subtotal,
                    p.product_slug,
                    pi.image_url as product_image
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.product_id
                LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
                WHERE oi.order_id = ?
            `, [orderId]);

            order.items = items;

            return order;

        } catch (error) {
            console.error('❌ Error in Order.getById:', error);
            throw error;
        }
    }

    static async getUserOrders(userId, options = {}) {
        const { page = 1, limit = 10, status } = options;
        const offset = (page - 1) * limit;

        try {
            let query = `
                SELECT 
                    o.order_id,
                    o.order_number,
                    o.user_id,
                    o.total_amount,
                    o.status,
                    o.payment_method,
                    o.payment_status,
                    o.shipping_full_name,
                    o.customer_phone,
                    o.shipping_address_line_1,
                    o.shipping_city,
                    o.shipping_state,
                    o.shipping_postal_code,
                    o.notes,
                    o.created_at,
                    o.updated_at
                FROM orders o
                WHERE o.user_id = ?
            `;

            const params = [userId];

            // Filter by status if provided
            if (status && status !== 'all') {
                query += ` AND o.status = ?`;
                params.push(status);
            }

            // Add ordering and pagination
            query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [orders] = await db.pool.query(query, params);

            // For each order, get order items
            for (let order of orders) {
                const [items] = await db.pool.query(`
                    SELECT 
                        oi.order_item_id,
                        oi.product_id,
                        oi.quantity,
                        oi.unit_price,
                        oi.unit_price as price,
                        oi.total_price,
                        oi.total_price as subtotal,
                        p.product_name,
                        p.product_slug,
                        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as product_image
                    FROM order_items oi
                    LEFT JOIN products p ON oi.product_id = p.product_id
                    WHERE oi.order_id = ?
                `, [order.order_id]);

                order.items = items;
            }

            // Get total count for pagination
            let countQuery = `SELECT COUNT(*) as total FROM orders WHERE user_id = ?`;
            const countParams = [userId];
            if (status && status !== 'all') {
                countQuery += ` AND status = ?`;
                countParams.push(status);
            }
            const [[{ total }]] = await db.pool.query(countQuery, countParams);

            return {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('❌ Error in getUserOrders:', error);
            throw error;
        }
    }

    static async getOrderDetails(orderId, userId) {
        try {
            const [orders] = await db.pool.query(`
                SELECT 
                    o.*,
                    u.username,
                    u.email
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.user_id
                WHERE o.order_id = ? AND o.user_id = ?
            `, [orderId, userId]);

            if (orders.length === 0) {
                return null;
            }

            const order = orders[0];

            // Get order items
            const [items] = await db.pool.query(`
                SELECT 
                    oi.*,
                    p.product_name,
                    p.product_image,
                    p.slug
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.product_id
                WHERE oi.order_id = ?
            `, [orderId]);

            order.items = items;

            return order;

        } catch (error) {
            console.error('❌ Error in getOrderDetails:', error);
            throw error;
        }
    }

    static async getTotalOrders(userId, status = null) {
        try {
            let query = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
            const params = [userId];

            if (status && status !== 'all') {
                query += ' AND status = ?';
                params.push(status);
            }

            const [result] = await db.pool.query(query, params);
            return result[0].total;

        } catch (error) {
            console.error('❌ Error in getTotalOrders:', error);
            throw error;
        }
    }

    static async createOrder(orderData) {
        const connection = await db.pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Generate order number
            const orderNumber = `ORD${Date.now()}`;

            // Calculate totals
            const subtotal = orderData.total_amount || 0;
            const shippingCost = orderData.shipping_cost || 0;
            const discountAmount = orderData.discount_amount || 0;
            const totalAmount = subtotal + shippingCost - discountAmount;

            // Insert order
            const [orderResult] = await connection.query(`
                INSERT INTO orders (
                    order_number,
                    user_id,
                    total_amount,
                    subtotal,
                    shipping_cost,
                    discount_amount,
                    status,
                    payment_method,
                    payment_status,
                    customer_email,
                    customer_phone,
                    shipping_full_name,
                    shipping_address_line_1,
                    shipping_city,
                    notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                orderNumber,
                orderData.user_id || null,
                totalAmount,
                subtotal,
                shippingCost,
                discountAmount,
                orderData.status || 'pending',
                orderData.payment_method || 'cod',
                orderData.payment_status || 'pending',
                orderData.customer_email || null,
                orderData.customer_phone,
                orderData.shipping_full_name || orderData.shipping_name,
                orderData.shipping_address_line_1 || orderData.shipping_address,
                orderData.shipping_city || 'TP.HCM',
                orderData.notes || null
            ]);

            const orderId = orderResult.insertId;

            // Insert order items
            if (orderData.items && orderData.items.length > 0) {
                for (const item of orderData.items) {
                    const totalPrice = item.quantity * parseFloat(item.unit_price);
                    
                    await connection.query(`
                        INSERT INTO order_items (
                            order_id,
                            product_id,
                            quantity,
                            unit_price,
                            total_price
                        ) VALUES (?, ?, ?, ?, ?)
                    `, [
                        orderId,
                        item.product_id,
                        item.quantity,
                        item.unit_price,
                        totalPrice
                    ]);

                    // Update product stock
                    await connection.query(`
                        UPDATE products 
                        SET stock_quantity = stock_quantity - ?
                        WHERE product_id = ?
                    `, [item.quantity, item.product_id]);
                }
            }

            await connection.commit();

            return {
                orderId: orderId,
                order_id: orderId,
                order_number: orderNumber,
                total_amount: totalAmount,
                status: orderData.status || 'pending'
            };

        } catch (error) {
            await connection.rollback();
            console.error('❌ Error in createOrder:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async updateOrderStatus(orderId, status) {
        try {
            const [result] = await db.pool.query(`
                UPDATE orders 
                SET status = ?, updated_at = NOW()
                WHERE order_id = ?
            `, [status, orderId]);

            return result.affectedRows > 0;

        } catch (error) {
            console.error('❌ Error in updateOrderStatus:', error);
            throw error;
        }
    }

    // Get all orders for admin with filters
    static async getAllForAdmin(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                payment_status,
                start_date,
                end_date,
                user_id,
                min_amount,
                max_amount,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = options;

            const offset = (page - 1) * limit;
            const params = [];
            let whereConditions = [];

            // Build WHERE clause
            if (status) {
                whereConditions.push('o.status = ?');
                params.push(status);
            }

            if (payment_status) {
                whereConditions.push('o.payment_status = ?');
                params.push(payment_status);
            }

            if (user_id) {
                whereConditions.push('o.user_id = ?');
                params.push(user_id);
            }

            if (min_amount) {
                whereConditions.push('o.total_amount >= ?');
                params.push(min_amount);
            }

            if (max_amount) {
                whereConditions.push('o.total_amount <= ?');
                params.push(max_amount);
            }

            if (start_date) {
                whereConditions.push('DATE(o.created_at) >= ?');
                params.push(start_date);
            }

            if (end_date) {
                whereConditions.push('DATE(o.created_at) <= ?');
                params.push(end_date);
            }

            const whereClause = whereConditions.length > 0 
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';

            // Count total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM orders o
                ${whereClause}
            `;

            const [countResult] = await db.pool.query(countQuery, params);
            const total = countResult[0].total;

            // Get orders
            const query = `
                SELECT 
                    o.order_id,
                    o.order_number,
                    o.user_id,
                    o.total_amount,
                    o.status,
                    o.payment_method,
                    o.payment_status,
                    o.shipping_full_name as customer_name,
                    o.customer_email as email,
                    o.customer_phone as phone,
                    CONCAT(o.shipping_address_line_1, ', ', o.shipping_city) as shipping_address,
                    o.shipping_city,
                    o.notes,
                    o.created_at,
                    o.updated_at,
                    COUNT(oi.order_item_id) as items_count
                FROM orders o
                LEFT JOIN order_items oi ON o.order_id = oi.order_id
                ${whereClause}
                GROUP BY o.order_id
                ORDER BY ${sort_by} ${sort_order}
                LIMIT ? OFFSET ?
            `;

            const [orders] = await db.pool.query(query, [...params, limit, offset]);

            return {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: page < Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('❌ Error in Order.getAllForAdmin:', error);
            throw error;
        }
    }

    static async updateStatus(orderId, updateData) {
        try {
            console.log(`🔄 Updating order ${orderId} with data:`, updateData);

            // Build SET clause dynamically
            const setClause = [];
            const values = [];

            if (updateData.status) {
                setClause.push('status = ?');
                values.push(updateData.status);
            }

            if (updateData.tracking_number) {
                setClause.push('tracking_number = ?');
                values.push(updateData.tracking_number);
            }

            if (updateData.shipping_notes) {
                setClause.push('shipping_notes = ?');
                values.push(updateData.shipping_notes);
            }

            if (updateData.shipped_at) {
                setClause.push('shipped_at = ?');
                values.push(updateData.shipped_at);
            }

            if (updateData.delivered_at) {
                setClause.push('delivered_at = ?');
                values.push(updateData.delivered_at);
            }

            // Always update updated_at
            setClause.push('updated_at = ?');
            values.push(updateData.updated_at || new Date());

            // Add orderId to values
            values.push(orderId);

            const query = `
                UPDATE orders 
                SET ${setClause.join(', ')}
                WHERE order_id = ?
            `;

            console.log(`📝 SQL Query:`, query);
            console.log(`📝 Values:`, values);

            const [result] = await db.pool.query(query, values);

            console.log(`✅ Update result:`, result);

            return result.affectedRows > 0;

        } catch (error) {
            console.error('❌ Error in Order.updateStatus:', error);
            throw error;
        }
    }
}

module.exports = Order;

