const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const wishlistValidation = require('../validators/wishlistValidator');
const { authenticateToken } = require('../middleware/auth');

// Add item to wishlist
router.post('/', 
    authenticateToken,
    wishlistValidation.validateAddItem,
    wishlistController.addItem
);

// Get user wishlist
router.get('/', 
    authenticateToken,
    wishlistController.getWishlist
);

// Get wishlist count
router.get('/count', 
    authenticateToken,
    wishlistController.getCount
);

// Check if product is in wishlist
router.get('/check/:productId', 
    authenticateToken,
    wishlistController.checkProduct
);

// Remove item from wishlist
router.delete('/:productId', 
    authenticateToken,
    wishlistController.removeItem
);

module.exports = router;
