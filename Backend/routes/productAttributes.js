const express = require('express');
const router = express.Router();
const productAttributeController = require('../controllers/productAttributeController');
// const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ✅ CORS Preflight handler
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id, x-tab-id');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Public routes - for filtering and display
router.get('/category/:categoryId/definitions', productAttributeController.getAttributesByCategory);
router.get('/category/:categoryId/filters', productAttributeController.getFilterOptions);
router.get('/category/:categoryId/products/filter', productAttributeController.filterProducts);
router.get('/product/:productId', productAttributeController.getProductAttributes);

// Admin routes - for managing product attributes
// router.use(authenticateToken);
// router.use(requireAdmin);
router.post('/product/:productId', productAttributeController.setProductAttributes);
router.put('/product/:productId', productAttributeController.setProductAttributes);

module.exports = router;
