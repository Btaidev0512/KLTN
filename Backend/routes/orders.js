const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const orderValidation = require('../validators/orderValidator');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/status/:orderNumber', orderController.getOrderStatus);

// User routes (require authentication)
router.post('/', 
    optionalAuth, // Allow both authenticated and guest users
    orderValidation.createOrder, 
    orderController.createOrder
);

router.get('/my-orders', 
    authenticateToken, 
    orderController.getUserOrders
);

// Get orders by user ID
router.get('/user/:userId', 
    authenticateToken, 
    orderController.getOrdersByUserId
);

router.get('/:id', 
    optionalAuth,
    orderController.getOrderById
);

router.put('/:id/cancel', 
    authenticateToken, 
    orderValidation.cancelOrder, 
    orderController.cancelOrder
);

// Get order tracking info
router.get('/:id/tracking', 
    optionalAuth,
    orderController.getOrderTracking
);

// Admin routes
router.get('/admin/all', 
    authenticateToken, 
    requireAdmin, 
    orderController.getAllOrders
);

router.get('/admin/:id', 
    authenticateToken, 
    requireAdmin, 
    orderController.getOrderByIdAdmin
);

router.put('/admin/:id/status', 
    authenticateToken, 
    requireAdmin, 
    orderValidation.updateOrderStatus, 
    orderController.updateOrderStatus
);

module.exports = router;