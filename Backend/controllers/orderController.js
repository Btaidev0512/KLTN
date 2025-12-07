const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { validationResult } = require('express-validator');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../config/email');

const orderController = {
    // Create order from cart
    createOrder: async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];

            // Get cart items
            const { items: cartItems } = await Cart.getItems(userId, sessionId);

            if (!cartItems || cartItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty'
                });
            }

            // Check if all products are available
            for (const item of cartItems) {
                if (item.product_status !== 'active') {
                    return res.status(400).json({
                        success: false,
                        message: `Product "${item.product_name}" is no longer available`
                    });
                }
                if (item.stock_quantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for product "${item.product_name}"`
                    });
                }
            }

            const orderData = {
                user_id: userId,
                session_id: sessionId,
                total_amount: cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
                items: cartItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.unit_price * item.quantity,
                    selected_attributes: item.selected_attributes || null
                })),
                ...req.body
            };

            console.log('📦 Creating order with data:', JSON.stringify(orderData, null, 2));
            console.log('📧 Customer email:', orderData.customer_email);
            console.log('📱 Customer phone:', orderData.customer_phone);

            const order = await Order.createOrder(orderData);
            console.log('✅ Order created:', order);

            // Clear cart after successful order
            if (userId) {
                await Cart.clearCart(userId, null);
            } else if (sessionId) {
                await Cart.clearCart(null, sessionId);
            }

            // 📧 Gửi email xác nhận đơn hàng (không chặn response)
            console.log('🔍 Checking email conditions:');
            console.log('  - customer_email:', orderData.customer_email);
            console.log('  - order_number:', order.order_number);
            console.log('  - Will send email:', !!(orderData.customer_email && order.order_number));
            
            if (orderData.customer_email && order.order_number) {
                const emailData = {
                    customer_email: orderData.customer_email,
                    order_number: order.order_number,
                    shipping_full_name: orderData.shipping_full_name || 'Khách hàng',
                    total_amount: orderData.total_amount,
                    items: cartItems.map(item => ({
                        product_name: item.product_name,
                        quantity: item.quantity,
                        unit_price: item.unit_price
                    })),
                    shipping_address_line_1: orderData.shipping_address_line_1,
                    shipping_city: orderData.shipping_city,
                    shipping_state: orderData.shipping_state,
                    payment_method: orderData.payment_method || 'cod',
                    created_at: new Date()
                };

                // Gửi email async (không đợi kết quả)
                sendOrderConfirmationEmail(emailData)
                    .then(() => console.log(`✅ Confirmation email queued for order ${order.order_number}`))
                    .catch(err => console.error(`❌ Failed to send confirmation email for order ${order.order_number}:`, err.message));
            }

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                orderId: order.orderId,
                data: order
            });
        } catch (error) {
            console.error('Error in createOrder:', error);
            
            if (error.message.includes('Insufficient stock')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get user's orders
    getUserOrders: async (req, res) => {
        try {
            const userId = req.user.id;
            const {
                page = 1,
                limit = 10,
                status
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 50),
                status
            };

            const result = await Order.getUserOrders(userId, options);
            
            console.log(`📦 getUserOrders: user_id=${userId}, found ${result.orders.length} orders`);

            res.json({
                success: true,
                message: 'Orders retrieved successfully',
                data: {
                    orders: result.orders,
                    pagination: result.pagination
                }
            });
        } catch (error) {
            console.error('Error in getUserOrders:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get orders by user ID (for profile page)
    getOrdersByUserId: async (req, res) => {
        try {
            const { userId } = req.params;
            const currentUserId = req.user.user_id || req.user.id;
            
            // Đảm bảo user chỉ có thể xem orders của chính họ
            if (parseInt(userId) !== parseInt(currentUserId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền truy cập đơn hàng này'
                });
            }

            const {
                page = 1,
                limit = 10,
                status
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 50),
                status
            };

            const result = await Order.getUserOrders(parseInt(userId), options);

            res.json({
                success: true,
                message: 'Orders retrieved successfully',
                orders: result.orders,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error in getOrdersByUserId:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get order by ID (user can only see their orders)
    getOrderById: async (req, res) => {
        try {
            const { id: orderId } = req.params;
            const userId = req.user?.id || null;

            if (!orderId || isNaN(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID'
                });
            }

            const order = await Order.getById(orderId, userId);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                message: 'Order retrieved successfully',
                data: order
            });
        } catch (error) {
            console.error('Error in getOrderById:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Cancel order (user)
    cancelOrder: async (req, res) => {
        try {
            const { id: orderId } = req.params;
            const userId = req.user.id;
            const { reason } = req.body;

            if (!orderId || isNaN(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID'
                });
            }

            const order = await Order.cancel(orderId, userId, reason);

            res.json({
                success: true,
                message: 'Order cancelled successfully',
                data: order
            });
        } catch (error) {
            console.error('Error in cancelOrder:', error);
            
            if (error.message.includes('not found') || 
                error.message.includes('can only be cancelled')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get order status by order number (guest access)
    getOrderStatus: async (req, res) => {
        try {
            const { orderNumber } = req.params;
            const { phone } = req.query;

            if (!orderNumber || !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Order number and phone number are required'
                });
            }

            // Get order by order number and phone (for security)
            const query = `
                SELECT 
                    o.id, o.order_number, o.status, o.total_amount,
                    o.customer_name, o.customer_phone, o.shipping_method,
                    o.payment_method, o.payment_status, o.created_at,
                    o.confirmed_at, o.shipped_at, o.delivered_at,
                    COUNT(oi.id) as total_items
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.order_number = ? AND o.customer_phone = ?
                GROUP BY o.id
            `;

            const [orders] = await db.execute(query, [orderNumber, phone]);

            if (orders.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found or phone number does not match'
                });
            }

            res.json({
                success: true,
                message: 'Order status retrieved successfully',
                data: orders[0]
            });
        } catch (error) {
            console.error('Error in getOrderStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Admin: Get all orders
    getAllOrders: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                search = '',
                date_from,
                date_to
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100),
                status,
                search: search.trim(),
                date_from,
                date_to
            };

            const result = await Order.getAllOrders(options);

            res.json({
                success: true,
                message: 'Orders retrieved successfully',
                data: result.orders,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error in getAllOrders:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Admin: Update order status
    updateOrderStatus: async (req, res) => {
        try {
            const { id: orderId } = req.params;
            const { status, notes } = req.body;
            const adminId = req.user.id;

            if (!orderId || isNaN(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID'
                });
            }

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Status is required'
                });
            }

            const order = await Order.updateStatus(orderId, status, adminId, notes);

            res.json({
                success: true,
                message: 'Order status updated successfully',
                data: order
            });
        } catch (error) {
            console.error('Error in updateOrderStatus:', error);
            
            if (error.message.includes('not found') || 
                error.message.includes('Invalid status transition')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Admin: Get order by ID (full access)
    getOrderByIdAdmin: async (req, res) => {
        try {
            const { id: orderId } = req.params;

            if (!orderId || isNaN(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID'
                });
            }

            const order = await Order.getById(orderId); // No userId restriction for admin

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                message: 'Order retrieved successfully',
                data: order
            });
        } catch (error) {
            console.error('Error in getOrderByIdAdmin:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // 📊 Get all orders for admin with advanced filtering
    getAllOrdersAdmin: async (req, res) => {
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
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100),
                status,
                payment_status,
                start_date,
                end_date,
                user_id: user_id ? parseInt(user_id) : null,
                min_amount: min_amount ? parseFloat(min_amount) : null,
                max_amount: max_amount ? parseFloat(max_amount) : null,
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const result = await Order.getAllForAdmin(options);

            // Map backend status to frontend status
            const mappedOrders = result.orders.map(order => ({
                ...order,
                status: order.status === 'shipped' ? 'shipping' : 
                        order.status === 'delivered' ? 'completed' : 
                        order.status
            }));

            res.json({
                success: true,
                message: 'Orders retrieved successfully',
                data: mappedOrders,
                pagination: result.pagination,
                count: mappedOrders.length
            });
        } catch (error) {
            console.error('Error getting orders for admin:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get orders',
                error: error.message
            });
        }
    },

    // 🔄 Update order status (Admin only)
    updateOrderStatusAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            let { status, tracking_number, shipping_notes } = req.body;

            console.log(`📝 Admin update request - Order: ${id}, New status: ${status}`);

            // Map frontend status to backend status
            const statusMapping = {
                'shipping': 'shipped',    // Frontend uses 'shipping', backend uses 'shipped'
                'completed': 'delivered'  // Frontend uses 'completed', backend uses 'delivered'
            };
            
            // Convert status if needed
            if (statusMapping[status]) {
                console.log(`🔄 Mapping status: ${status} → ${statusMapping[status]}`);
                status = statusMapping[status];
            }

            const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'];
            if (!validStatuses.includes(status)) {
                console.log(`❌ Invalid status: ${status}`);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
                });
            }

            const existingOrder = await Order.getById(id);
            if (!existingOrder) {
                console.log(`❌ Order not found: ${id}`);
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            console.log(`📊 Current order status: ${existingOrder.status}`);

            const updateData = {
                status,
                updated_at: new Date()
            };

            if (tracking_number) updateData.tracking_number = tracking_number;
            if (shipping_notes) updateData.shipping_notes = shipping_notes;

            // If order is being shipped, add shipped_at timestamp
            if (status === 'shipped' && existingOrder.status !== 'shipped') {
                updateData.shipped_at = new Date();
            }

            // If order is being delivered, add delivered_at timestamp
            if (status === 'delivered' && existingOrder.status !== 'delivered') {
                updateData.delivered_at = new Date();
            }

            const success = await Order.updateStatus(id, updateData);

            if (success) {
                // Log admin action
                console.log(`✅ Admin ${req.user.user_id} updated order ${id} status to ${status}`);

                // 📧 Gửi email thông báo thay đổi trạng thái (không chặn response)
                if (existingOrder.customer_email && existingOrder.status !== status) {
                    const emailData = {
                        customer_email: existingOrder.customer_email,
                        order_number: existingOrder.order_number,
                        shipping_full_name: existingOrder.shipping_full_name || 'Khách hàng',
                        total_amount: existingOrder.total_amount,
                        tracking_number: tracking_number || existingOrder.tracking_number
                    };

                    // Gửi email async (không đợi kết quả)
                    sendOrderStatusUpdateEmail(emailData, existingOrder.status, status)
                        .then(() => console.log(`✅ Status update email queued for order ${existingOrder.order_number}: ${existingOrder.status} → ${status}`))
                        .catch(err => console.error(`❌ Failed to send status update email for order ${existingOrder.order_number}:`, err.message));
                }

                res.json({
                    success: true,
                    message: 'Order status updated successfully',
                    data: {
                        order_id: id,
                        new_status: status,
                        updated_at: updateData.updated_at
                    }
                });
            } else {
                console.log(`❌ Failed to update order ${id}`);
                res.status(400).json({
                    success: false,
                    message: 'Failed to update order status'
                });
            }
        } catch (error) {
            console.error('❌ Error updating order status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order status',
                error: error.message
            });
        }
    },

    // 📈 Get order statistics for admin dashboard
    getOrderStats: async (req, res) => {
        try {
            const { period = '30' } = req.query;
            const days = parseInt(period);

            const stats = await Order.getStats(days);

            res.json({
                success: true,
                message: 'Order statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Error getting order stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get order statistics',
                error: error.message
            });
        }
    },

    // 📋 Get detailed order information for admin
    getOrderDetailsAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            
            console.log('🔍 getOrderDetailsAdmin called with id:', id);

            // Get order details for admin (no user_id filter)
            const [orders] = await require('../config/database').pool.query(`
                SELECT 
                    o.*,
                    u.username,
                    u.email,
                    u.full_name as customer_name
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.user_id
                WHERE o.order_id = ?
            `, [id]);
            
            console.log('📦 Found orders:', orders.length);

            if (orders.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            const order = orders[0];

            // Get order items
            const [items] = await require('../config/database').pool.query(`
                SELECT 
                    oi.*,
                    p.product_name,
                    p.image_url as product_image,
                    p.product_slug as slug
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.product_id
                WHERE oi.order_id = ?
            `, [id]);
            
            console.log('📦 Found items:', items.length);

            order.items = items;
            
            // Format address and phone for frontend
            order.phone = order.customer_phone || 'N/A';
            
            // Build full shipping address
            const addressParts = [
                order.shipping_address_line_1,
                order.shipping_address_line_2,
                order.shipping_city,
                order.shipping_state,
                order.shipping_postal_code,
                order.shipping_country
            ].filter(Boolean);
            
            order.shipping_address = addressParts.join(', ') || 'N/A';

            // Map backend status to frontend status
            const mappedOrder = {
                ...order,
                status: order.status === 'shipped' ? 'shipping' : 
                        order.status === 'delivered' ? 'completed' : 
                        order.status
            };
            
            console.log('✅ Returning order:', mappedOrder.order_number);

            res.json({
                success: true,
                message: 'Order details retrieved successfully',
                data: mappedOrder
            });
        } catch (error) {
            console.error('❌ Error getting order details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get order details',
                error: error.message
            });
        }
    },

    // 💰 Get daily revenue
    getDailyRevenue: async (req, res) => {
        try {
            const { days = 30 } = req.query;
            const revenue = await Order.getDailyRevenue(parseInt(days));

            res.json({
                success: true,
                message: 'Daily revenue retrieved successfully',
                data: revenue
            });
        } catch (error) {
            console.error('Error getting daily revenue:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get daily revenue',
                error: error.message
            });
        }
    },

    // 📅 Get monthly revenue
    getMonthlyRevenue: async (req, res) => {
        try {
            const { months = 12 } = req.query;
            const revenue = await Order.getMonthlyRevenue(parseInt(months));

            res.json({
                success: true,
                message: 'Monthly revenue retrieved successfully',
                data: revenue
            });
        } catch (error) {
            console.error('Error getting monthly revenue:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get monthly revenue',
                error: error.message
            });
        }
    },

    // 📊 Get comprehensive dashboard analytics
    getDashboardAnalytics: async (req, res) => {
        try {
            const analytics = await Order.getDashboardAnalytics();

            res.json({
                success: true,
                message: 'Dashboard analytics retrieved successfully',
                data: analytics
            });
        } catch (error) {
            console.error('Error getting dashboard analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get dashboard analytics',
                error: error.message
            });
        }
    },

    // Get order tracking information
    getOrderTracking: async (req, res) => {
        try {
            const orderId = req.params.id;
            const userId = req.user?.id || null;

            // Get order tracking info
            const tracking = await Order.getTracking(orderId, userId);

            if (!tracking) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found or access denied'
                });
            }

            res.json({
                success: true,
                message: 'Order tracking retrieved successfully',
                data: tracking
            });
        } catch (error) {
            console.error('Error in getOrderTracking:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = orderController;