const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All dashboard routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Get complete dashboard data
router.get('/', dashboardController.getFullDashboard);

// Get individual dashboard components
router.get('/overview', dashboardController.getOverview);
router.get('/revenue', dashboardController.getRevenueStats);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/order-status', dashboardController.getOrderStatusDistribution);
router.get('/inventory-alerts', dashboardController.getInventoryAlerts);
router.get('/customer-insights', dashboardController.getCustomerInsights);
router.get('/best-customers', dashboardController.getBestCustomers);
router.get('/sales-by-category', dashboardController.getSalesByCategory);

module.exports = router;