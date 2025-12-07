const Dashboard = require('../models/Dashboard');

const dashboardController = {
    // Get overview statistics
    getOverview: async (req, res) => {
        try {
            const stats = await Dashboard.getOverviewStats();

            res.json({
                success: true,
                message: 'Overview statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Error in getOverview:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get revenue statistics
    getRevenueStats: async (req, res) => {
        try {
            const { period = 'month' } = req.query;
            
            const validPeriods = ['week', 'month', 'year'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid period. Must be one of: week, month, year'
                });
            }

            const stats = await Dashboard.getRevenueStats(period);

            res.json({
                success: true,
                message: 'Revenue statistics retrieved successfully',
                data: {
                    period,
                    stats
                }
            });
        } catch (error) {
            console.error('Error in getRevenueStats:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get top selling products
    getTopProducts: async (req, res) => {
        try {
            const { limit = 10 } = req.query;
            const products = await Dashboard.getTopSellingProducts(Math.min(parseInt(limit), 50));

            res.json({
                success: true,
                message: 'Top selling products retrieved successfully',
                data: products,
                count: products.length
            });
        } catch (error) {
            console.error('Error in getTopProducts:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get recent orders
    getRecentOrders: async (req, res) => {
        try {
            const { limit = 10 } = req.query;
            const orders = await Dashboard.getRecentOrders(Math.min(parseInt(limit), 50));

            res.json({
                success: true,
                message: 'Recent orders retrieved successfully',
                data: orders,
                count: orders.length
            });
        } catch (error) {
            console.error('Error in getRecentOrders:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get order status distribution
    getOrderStatusDistribution: async (req, res) => {
        try {
            const distribution = await Dashboard.getOrderStatusDistribution();

            res.json({
                success: true,
                message: 'Order status distribution retrieved successfully',
                data: distribution
            });
        } catch (error) {
            console.error('Error in getOrderStatusDistribution:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get inventory alerts
    getInventoryAlerts: async (req, res) => {
        try {
            const alerts = await Dashboard.getInventoryAlerts();

            res.json({
                success: true,
                message: 'Inventory alerts retrieved successfully',
                data: alerts,
                count: alerts.length
            });
        } catch (error) {
            console.error('Error in getInventoryAlerts:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get customer insights
    getCustomerInsights: async (req, res) => {
        try {
            const insights = await Dashboard.getCustomerInsights();

            res.json({
                success: true,
                message: 'Customer insights retrieved successfully',
                data: insights
            });
        } catch (error) {
            console.error('Error in getCustomerInsights:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get complete dashboard data
    getFullDashboard: async (req, res) => {
        try {
            const [
                overview,
                revenueStats,
                topProducts,
                recentOrders,
                statusDistribution,
                inventoryAlerts,
                customerInsights
            ] = await Promise.all([
                Dashboard.getOverviewStats(),
                Dashboard.getRevenueStats('month'),
                Dashboard.getTopSellingProducts(5),
                Dashboard.getRecentOrders(5),
                Dashboard.getOrderStatusDistribution(),
                Dashboard.getInventoryAlerts(),
                Dashboard.getCustomerInsights()
            ]);

            res.json({
                success: true,
                message: 'Dashboard data retrieved successfully',
                data: {
                    overview,
                    revenue: {
                        period: 'month',
                        stats: revenueStats
                    },
                    top_products: topProducts,
                    recent_orders: recentOrders,
                    order_status_distribution: statusDistribution,
                    inventory_alerts: inventoryAlerts,
                    customer_insights: customerInsights,
                    generated_at: new Date()
                }
            });
        } catch (error) {
            console.error('Error in getFullDashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get best customers (Top customers by spending)
    getBestCustomers: async (req, res) => {
        try {
            const { limit = 10 } = req.query;
            const customers = await Dashboard.getBestCustomers(Math.min(parseInt(limit), 50));

            res.json({
                success: true,
                message: 'Best customers retrieved successfully',
                data: customers,
                count: customers.length
            });
        } catch (error) {
            console.error('Error in getBestCustomers:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get sales distribution by category
    getSalesByCategory: async (req, res) => {
        try {
            const salesData = await Dashboard.getSalesByCategory();

            res.json({
                success: true,
                message: 'Sales by category retrieved successfully',
                data: salesData,
                count: salesData.length
            });
        } catch (error) {
            console.error('Error in getSalesByCategory:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = dashboardController;