const Wishlist = require('../models/Wishlist');
const { validationResult } = require('express-validator');

const wishlistController = {
    addItem: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const userId = req.user.user_id;
            const { product_id } = req.body;

            const result = await Wishlist.addItem(userId, product_id);
            
            // Return 200 for existing items, 201 for new items
            const statusCode = result.isNew ? 201 : 200;
            const message = result.isNew 
                ? 'Product added to wishlist successfully' 
                : 'Product already in wishlist';
            
            res.status(statusCode).json({
                success: true,
                message: message,
                data: {
                    wishlist_item: result
                }
            });

        } catch (error) {
            console.error('Error adding item to wishlist:', error);
            
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    getWishlist: async (req, res) => {
        try {
            console.log('🔍 Getting wishlist for user:', req.user.user_id);
            const userId = req.user.user_id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            console.log('📊 Parameters:', { userId, page, limit });
            
            const result = await Wishlist.getUserWishlist(userId, page, limit);
            console.log('✅ Wishlist result:', result);
            
            res.json({
                success: true,
                message: 'Wishlist retrieved successfully',
                data: result
            });

        } catch (error) {
            console.error('❌ Error getting wishlist:', error);
            console.error('Error details:', error.message);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    getCount: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const count = await Wishlist.getCount(userId);
            
            res.json({
                success: true,
                message: 'Wishlist count retrieved successfully',
                data: {
                    count: count
                }
            });

        } catch (error) {
            console.error('Error getting wishlist count:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    checkProduct: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const productId = parseInt(req.params.productId);

            if (!productId || productId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID'
                });
            }

            const isInWishlist = await Wishlist.isInWishlist(userId, productId);
            
            res.json({
                success: true,
                message: 'Product check completed',
                data: {
                    product_id: productId,
                    is_in_wishlist: isInWishlist
                }
            });

        } catch (error) {
            console.error('Error checking product in wishlist:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    removeItem: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const productId = parseInt(req.params.productId);

            if (!productId || productId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID'
                });
            }

            const success = await Wishlist.removeItem(userId, productId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Product removed from wishlist successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Product not found in wishlist'
                });
            }

        } catch (error) {
            console.error('Error removing item from wishlist:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};

module.exports = wishlistController;
