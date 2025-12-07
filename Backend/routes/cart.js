const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const cartValidation = require('../validators/cartValidator');
const { optionalAuth } = require('../middleware/auth');

// All cart routes use optional auth (works for both logged in users and guests)
router.use(optionalAuth);

// Get cart items
router.get('/', cartController.getCart);

// Get cart summary only
router.get('/summary', cartController.getCartSummary);

// Get cart count (for header badge)
router.get('/count', cartController.getCartCount);

// Get cart statistics
router.get('/statistics', cartController.getStatistics);

// Validate cart for checkout
router.get('/validate', cartController.validateCart);

// Prepare checkout data
router.get('/checkout/prepare', cartController.prepareCheckout);

// Sync cart with inventory
router.post('/sync', cartController.syncInventory);

// Add item to cart
router.post('/add', cartValidation.addToCart, cartController.addToCart);

// Apply coupon to cart
router.post('/coupon', cartValidation.applyCoupon, cartController.applyCoupon);

// Checkout (create order from cart)
router.post('/checkout', cartValidation.checkout, cartController.checkout);

// Update cart item quantity
router.put('/:id', cartValidation.updateCart, cartController.updateCartItem);

// Update cart prices to current prices
router.put('/prices/update', cartController.updatePrices);

// Remove item from cart
router.delete('/:id', cartController.removeFromCart);

// Clear entire cart
router.delete('/clear', cartController.clearCart);

module.exports = router;