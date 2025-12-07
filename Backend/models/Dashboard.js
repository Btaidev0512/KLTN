const db = require('../config/database');

class Dashboard {
    // Get overview statistics
    static async getOverviewStats() {
        try {
            const stats = {
                total_orders: 0,
                total_revenue: 0,
                total_products: 0,
                total_customers: 0,
                pending_orders: 0,
                low_stock_products: 0,
                revenue_growth: 0,
                orders_growth: 0,
                customers_growth: 0
            };

            // Get total orders and revenue for this month
            const [orderStats] = await db.execute(`
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END) as total_revenue,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders
                FROM orders
                WHERE YEAR(created_at) = YEAR(CURDATE()) 
                AND MONTH(created_at) = MONTH(CURDATE())
            `);

            if (orderStats.length > 0) {
                stats.total_orders = orderStats[0].total_orders;
                stats.total_revenue = orderStats[0].total_revenue || 0;
                stats.pending_orders = orderStats[0].pending_orders;
            }

            // Get last month stats for growth calculation
            const [lastMonthStats] = await db.execute(`
                SELECT 
                    COUNT(*) as last_month_orders,
                    SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END) as last_month_revenue
                FROM orders
                WHERE YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            `);

            if (lastMonthStats.length > 0 && lastMonthStats[0].last_month_orders > 0) {
                stats.revenue_growth = lastMonthStats[0].last_month_revenue > 0 
                    ? Math.round(((stats.total_revenue - lastMonthStats[0].last_month_revenue) / lastMonthStats[0].last_month_revenue) * 100)
                    : 0;
                stats.orders_growth = Math.round(((stats.total_orders - lastMonthStats[0].last_month_orders) / lastMonthStats[0].last_month_orders) * 100);
            }

            // Get total products
            const [productStats] = await db.execute(`
                SELECT COUNT(*) as total_products FROM products WHERE status = 'active'
            `);
            stats.total_products = productStats[0]?.total_products || 0;

            // Get total customers (users with role 'customer')
            const [userStats] = await db.execute(`
                SELECT COUNT(*) as total_customers FROM users WHERE role = 'customer'
            `);
            stats.total_customers = userStats[0]?.total_customers || 0;

            // Get customers from last month for growth
            const [lastMonthCustomers] = await db.execute(`
                SELECT COUNT(*) as last_month_customers 
                FROM users 
                WHERE role = 'customer'
                AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            `);

            if (lastMonthCustomers.length > 0 && lastMonthCustomers[0].last_month_customers > 0) {
                const thisMonthNewCustomers = await db.execute(`
                    SELECT COUNT(*) as new_customers 
                    FROM users 
                    WHERE role = 'customer'
                    AND YEAR(created_at) = YEAR(CURDATE())
                    AND MONTH(created_at) = MONTH(CURDATE())
                `);
                const newCount = thisMonthNewCustomers[0][0]?.new_customers || 0;
                stats.customers_growth = lastMonthCustomers[0].last_month_customers > 0
                    ? Math.round(((newCount - lastMonthCustomers[0].last_month_customers) / lastMonthCustomers[0].last_month_customers) * 100)
                    : 0;
            }

            // Get low stock products
            const [lowStockStats] = await db.execute(`
                SELECT COUNT(*) as low_stock_products 
                FROM products 
                WHERE stock_quantity <= 5 
                AND status = 'active'
            `);
            stats.low_stock_products = lowStockStats[0]?.low_stock_products || 0;

            return stats;
        } catch (error) {
            throw new Error(`Error getting overview stats: ${error.message}`);
        }
    }

    // Get revenue statistics by period
    static async getRevenueStats(period = 'month') {
        try {
            let dateFormat, dateInterval;
            
            switch (period) {
                case 'week':
                    dateFormat = '%Y-%u'; // Year-Week
                    dateInterval = '7 DAY';
                    break;
                case 'month':
                    dateFormat = '%Y-%m'; // Year-Month
                    dateInterval = '1 MONTH';
                    break;
                case 'year':
                    dateFormat = '%Y'; // Year
                    dateInterval = '1 YEAR';
                    break;
                default:
                    dateFormat = '%Y-%m';
                    dateInterval = '1 MONTH';
            }

            const query = `
                SELECT 
                    DATE_FORMAT(created_at, ?) as period,
                    COUNT(*) as order_count,
                    SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END) as revenue,
                    AVG(CASE WHEN status != 'cancelled' THEN total_amount ELSE NULL END) as avg_order_value
                FROM orders 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 ${dateInterval.split(' ')[1]})
                GROUP BY DATE_FORMAT(created_at, ?)
                ORDER BY period DESC
                LIMIT 12
            `;

            const [stats] = await db.execute(query, [dateFormat, dateFormat]);
            
            return stats.reverse(); // Show chronological order
        } catch (error) {
            throw new Error(`Error getting revenue stats: ${error.message}`);
        }
    }

    // Get top selling products
    static async getTopSellingProducts(limit = 10) {
        try {
            const query = `
                SELECT 
                    p.product_id, p.product_name, p.product_slug, p.base_price, p.sale_price,
                    SUM(oi.quantity) as total_sold,
                    SUM(oi.total_price) as total_revenue,
                    b.brand_name,
                    pi.image_url as product_image
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.product_id
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
                LEFT JOIN orders o ON oi.order_id = o.order_id
                WHERE o.status NOT IN ('cancelled')
                AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY p.product_id, p.product_name, p.product_slug, p.base_price, p.sale_price, b.brand_name, pi.image_url
                ORDER BY total_sold DESC
                LIMIT ?
            `;

            const [products] = await db.execute(query, [limit]);
            return products;
        } catch (error) {
            throw new Error(`Error getting top selling products: ${error.message}`);
        }
    }

    // Get recent orders
    static async getRecentOrders(limit = 10) {
        try {
            const query = `
                SELECT 
                    o.order_id, o.status, o.total_amount, o.created_at,
                    u.full_name as customer_name,
                    COUNT(oi.order_item_id) as items_count
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.user_id
                LEFT JOIN order_items oi ON o.order_id = oi.order_id
                GROUP BY o.order_id, o.status, o.total_amount, o.created_at, u.full_name
                ORDER BY o.created_at DESC
                LIMIT ?
            `;

            const [orders] = await db.execute(query, [limit]);
            return orders;
        } catch (error) {
            throw new Error(`Error getting recent orders: ${error.message}`);
        }
    }

    // Get order status distribution
    static async getOrderStatusDistribution() {
        try {
            const query = `
                SELECT 
                    status,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 2) as percentage
                FROM orders
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY status
                ORDER BY count DESC
            `;

            const [distribution] = await db.execute(query);
            return distribution;
        } catch (error) {
            throw new Error(`Error getting order status distribution: ${error.message}`);
        }
    }

    // Get inventory alerts
    static async getInventoryAlerts() {
        try {
            const query = `
                SELECT 
                    p.id, p.name, p.sku, p.stock_quantity,
                    c.name as category_name,
                    b.name as brand_name,
                    CASE 
                        WHEN p.stock_quantity = 0 THEN 'out_of_stock'
                        WHEN p.stock_quantity <= 5 THEN 'low_stock'
                        ELSE 'normal'
                    END as alert_type
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN brands b ON p.brand_id = b.id
                WHERE p.status = 'active' 
                AND p.stock_quantity <= 5
                ORDER BY p.stock_quantity ASC
                LIMIT 20
            `;

            const [alerts] = await db.execute(query);
            return alerts;
        } catch (error) {
            throw new Error(`Error getting inventory alerts: ${error.message}`);
        }
    }

    // Get customer insights
    static async getCustomerInsights() {
        try {
            const insights = {};

            // New customers this month
            const [newCustomers] = await db.execute(`
                SELECT COUNT(*) as new_customers
                FROM users 
                WHERE role = 'user' 
                AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            `);
            insights.new_customers_this_month = newCustomers[0]?.new_customers || 0;

            // Top customers by order value
            const [topCustomers] = await db.execute(`
                SELECT 
                    u.id, u.full_name, u.email,
                    COUNT(o.id) as total_orders,
                    SUM(o.total_amount) as total_spent
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
                WHERE u.role = 'user'
                GROUP BY u.id
                HAVING total_orders > 0
                ORDER BY total_spent DESC
                LIMIT 10
            `);
            insights.top_customers = topCustomers;

            // Customer order frequency
            const [orderFrequency] = await db.execute(`
                SELECT 
                    CASE 
                        WHEN order_count = 1 THEN '1 order'
                        WHEN order_count BETWEEN 2 AND 5 THEN '2-5 orders'
                        WHEN order_count BETWEEN 6 AND 10 THEN '6-10 orders'
                        ELSE '10+ orders'
                    END as frequency_range,
                    COUNT(*) as customer_count
                FROM (
                    SELECT u.id, COUNT(o.id) as order_count
                    FROM users u
                    LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
                    WHERE u.role = 'user'
                    GROUP BY u.id
                    HAVING order_count > 0
                ) customer_orders
                GROUP BY frequency_range
                ORDER BY customer_count DESC
            `);
            insights.order_frequency_distribution = orderFrequency;

            return insights;
        } catch (error) {
            throw new Error(`Error getting customer insights: ${error.message}`);
        }
    }

    // Get best customers by total spending
    static async getBestCustomers(limit = 10) {
        try {
            const query = `
                SELECT 
                    u.user_id,
                    u.full_name,
                    u.email,
                    u.avatar_url,
                    COUNT(DISTINCT o.order_id) as total_orders,
                    COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as total_spent
                FROM users u
                LEFT JOIN orders o ON u.user_id = o.user_id
                WHERE u.role = 'customer'
                GROUP BY u.user_id, u.full_name, u.email, u.avatar_url
                HAVING total_orders > 0
                ORDER BY total_spent DESC
                LIMIT ?
            `;

            const [customers] = await db.execute(query, [limit]);
            return customers;
        } catch (error) {
            console.error('Error in Dashboard.getBestCustomers:', error);
            throw new Error(`Error getting best customers: ${error.message}`);
        }
    }

    // Get sales distribution by category
    static async getSalesByCategory() {
        try {
            const query = `
                SELECT 
                    c.category_name,
                    COUNT(DISTINCT oi.product_id) as total_products,
                    COALESCE(SUM(oi.total_price), 0) as total_revenue,
                    ROUND(
                        COALESCE(SUM(oi.total_price), 0) * 100.0 / 
                        (SELECT SUM(total_price) FROM order_items oi2 
                         JOIN orders o2 ON oi2.order_id = o2.order_id 
                         WHERE o2.status != 'cancelled'), 
                        2
                    ) as percentage
                FROM categories c
                LEFT JOIN products p ON c.category_id = p.category_id
                LEFT JOIN order_items oi ON p.product_id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status != 'cancelled'
                WHERE c.is_active = true
                GROUP BY c.category_id, c.category_name
                HAVING total_revenue > 0
                ORDER BY total_revenue DESC
                LIMIT 15
            `;

            const [salesData] = await db.execute(query);
            return salesData;
        } catch (error) {
            console.error('Error in Dashboard.getSalesByCategory:', error);
            throw new Error(`Error getting sales by category: ${error.message}`);
        }
    }
}

module.exports = Dashboard;