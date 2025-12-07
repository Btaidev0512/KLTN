const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const userController = require('../controllers/authController');
const productController = require('../controllers/productController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 📊 Admin Order Management
router.get('/orders', authenticateToken, requireAdmin, orderController.getAllOrdersAdmin);
router.get('/orders/stats', authenticateToken, requireAdmin, orderController.getOrderStats);
router.get('/orders/:id/details', authenticateToken, requireAdmin, orderController.getOrderDetailsAdmin);
router.put('/orders/:id/status', authenticateToken, requireAdmin, orderController.updateOrderStatusAdmin);

// 👥 Admin User Management
router.get('/users', authenticateToken, requireAdmin, userController.getAllUsersAdmin);
router.put('/users/:id/status', authenticateToken, requireAdmin, userController.updateUserStatusAdmin);
router.get('/users/stats', authenticateToken, requireAdmin, userController.getUserStats);
router.delete('/users/:id', authenticateToken, requireAdmin, userController.deleteUserAdmin);

// 📦 Admin Product Management
router.get('/products/low-stock', authenticateToken, requireAdmin, productController.getLowStockProducts);
router.put('/products/:id/stock', authenticateToken, requireAdmin, productController.updateStock);
router.get('/products/stats', authenticateToken, requireAdmin, productController.getProductStats);

// 💰 Admin Revenue & Analytics
router.get('/revenue/daily', authenticateToken, requireAdmin, orderController.getDailyRevenue);
router.get('/revenue/monthly', authenticateToken, requireAdmin, orderController.getMonthlyRevenue);
router.get('/analytics/dashboard', authenticateToken, requireAdmin, orderController.getDashboardAnalytics);

module.exports = router;