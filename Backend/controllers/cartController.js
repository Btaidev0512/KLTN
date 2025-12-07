const Cart = require('../models/Cart');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const cartController = {
    // Get cart items
    getCart: async (req, res) => {
        try {
            console.log('🛒 GET CART - req.user:', req.user);
            console.log('🛒 GET CART - req.user.id:', req.user?.id);
            console.log('🛒 GET CART - req.user.user_id:', req.user?.user_id);
            
            const userId = req.user?.id || null;
            let sessionId = req.sessionID || req.headers['x-session-id'];
            
            console.log('🛒 Using userId:', userId);
            console.log('🛒 Using sessionId:', sessionId);
            
            // Generate session ID if not exists for guest users
            if (!userId && !sessionId) {
                sessionId = uuidv4();
                res.setHeader('x-session-id', sessionId);
            }

            console.log('🛒 Calling Cart.getItems with userId:', userId, 'sessionId:', sessionId);
            const { items, summary } = await Cart.getItems(userId, sessionId);
            console.log('🛒 Cart.getItems returned:', items.length, 'items');

            res.json({
                success: true,
                message: 'Cart retrieved successfully',
                data: {
                    items,
                    summary,
                    session_id: !userId ? sessionId : undefined
                }
            });
        } catch (error) {
            console.error('Error in getCart:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Add item to cart
    addToCart: async (req, res) => {
        try {
            // Log request for debugging
            console.log('🛒 Add to cart request:', {
                body: req.body,
                headers: req.headers['content-type'],
                authorization: req.headers.authorization ? 'Bearer ***' : 'NO TOKEN',
                user: req.user ? {
                    id: req.user.id,
                    email: req.user.email,
                    full_name: req.user.full_name
                } : 'GUEST USER (no req.user)'
            });

            // Check if request body exists
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Request body is required',
                    expected_format: {
                        product_id: 'number (required)',
                        quantity: 'number (optional, default: 1)',
                        selected_attributes: 'object (optional)'
                    }
                });
            }

            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                    received_data: req.body
                });
            }

            const { product_id, quantity, selected_attributes } = req.body;

            // Additional validation
            if (!product_id || isNaN(product_id) || product_id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid product_id is required (must be a positive number)',
                    received: {
                        product_id: product_id,
                        type: typeof product_id
                    }
                });
            }

            const userId = req.user?.id || null;
            let sessionId = req.sessionID || req.headers['x-session-id'];
            
            // Generate session ID if not exists for guest users
            if (!userId && !sessionId) {
                sessionId = uuidv4();
                res.setHeader('x-session-id', sessionId);
            }

            const itemData = {
                user_id: userId,
                session_id: sessionId,
                product_id: parseInt(product_id),
                quantity: quantity ? parseInt(quantity) : 1,
                selected_attributes
            };

            console.log('🛒 Processing cart item:', itemData);

            const cartItem = await Cart.addItem(itemData);

            res.status(200).json({
                success: true,
                message: 'Item added to cart successfully',
                data: {
                    item: cartItem,
                    session_id: !userId ? sessionId : undefined
                }
            });
        } catch (error) {
            console.error('❌ Error in addToCart:', error);
            
            if (error.message.includes('not found') || 
                error.message.includes('not available') || 
                error.message.includes('Insufficient stock')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                debug_info: process.env.NODE_ENV !== 'production' ? {
                    stack: error.stack,
                    request_body: req.body
                } : undefined
            });
        }
    },

    // Update cart item
    updateCartItem: async (req, res) => {
        try {
            const { id: cartId } = req.params;
            const { quantity } = req.body;

            if (!cartId || isNaN(cartId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid cart item ID'
                });
            }

            if (!quantity || isNaN(quantity) || quantity < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid quantity'
                });
            }

            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];

            if (quantity === 0) {
                const removed = await Cart.removeItem(cartId, userId, sessionId);
                if (!removed) {
                    return res.status(404).json({
                        success: false,
                        message: 'Cart item not found'
                    });
                }

                return res.json({
                    success: true,
                    message: 'Item removed from cart successfully'
                });
            }

            const updatedItem = await Cart.updateItem(cartId, quantity, userId, sessionId);

            if (!updatedItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }

            res.json({
                success: true,
                message: 'Cart item updated successfully',
                data: updatedItem
            });
        } catch (error) {
            console.error('Error in updateCartItem:', error);
            
            if (error.message.includes('not found') || 
                error.message.includes('Insufficient stock')) {
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

    // Remove item from cart
    removeFromCart: async (req, res) => {
        try {
            const { id: cartId } = req.params;

            if (!cartId || isNaN(cartId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid cart item ID'
                });
            }

            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];

            const removed = await Cart.removeItem(cartId, userId, sessionId);

            if (!removed) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }

            res.json({
                success: true,
                message: 'Item removed from cart successfully'
            });
        } catch (error) {
            console.error('Error in removeFromCart:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Clear entire cart
    clearCart: async (req, res) => {
        try {
            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];

            const removedCount = await Cart.clearCart(userId, sessionId);

            res.json({
                success: true,
                message: `Cart cleared successfully. ${removedCount} items removed.`,
                data: {
                    removed_count: removedCount
                }
            });
        } catch (error) {
            console.error('Error in clearCart:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get cart summary only
    getCartSummary: async (req, res) => {
        try {
            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];

            const { items, summary } = await Cart.getItems(userId, sessionId);

            res.json({
                success: true,
                message: 'Cart summary retrieved successfully',
                data: summary
            });
        } catch (error) {
            console.error('Error in getCartSummary:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Apply coupon to cart
    applyCoupon: async (req, res) => {
        try {
            const { coupon_code } = req.body;

            if (!coupon_code || typeof coupon_code !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon code is required'
                });
            }

            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];

            const result = await Cart.applyCoupon(coupon_code.toUpperCase(), userId, sessionId);

            res.json({
                success: true,
                message: 'Coupon applied successfully',
                data: result
            });

        } catch (error) {
            console.error('Error in applyCoupon:', error);
            
            if (error.message.includes('not valid') ||
                error.message.includes('expired') ||
                error.message.includes('already been used') ||
                error.message.includes('Minimum order') ||
                error.message.includes('empty')) {
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

    // Validate cart for checkout
    validateCart: async (req, res) => {
        try {
            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];

            const validation = await Cart.validateCartForCheckout(userId, sessionId);

            res.json({
                success: true,
                message: validation.valid ? 'Cart is valid for checkout' : 'Cart has validation issues',
                data: validation
            });

        } catch (error) {
            console.error('Error in validateCart:', error);
            
            if (error.message.includes('empty')) {
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

    // Update cart prices to current prices
    updatePrices: async (req, res) => {
        try {
            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];

            const updatedCount = await Cart.updateCartPrices(userId, sessionId);

            res.json({
                success: true,
                message: `Cart prices updated successfully. ${updatedCount} items updated.`,
                data: {
                    updated_count: updatedCount
                }
            });

        } catch (error) {
            console.error('Error in updatePrices:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get cart count (for header badge)
    getCartCount: async (req, res) => {
        try {
            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];

            const { summary } = await Cart.getItems(userId, sessionId);

            res.json({
                success: true,
                message: 'Cart count retrieved successfully',
                data: {
                    count: summary.total_quantity
                }
            });

        } catch (error) {
            console.error('Error in getCartCount:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Prepare checkout data
    prepareCheckout: async (req, res) => {
        try {
            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];
            const { coupon_code } = req.query;

            const checkoutData = await Cart.prepareCheckout(userId, sessionId, coupon_code);

            res.json({
                success: true,
                message: 'Checkout data prepared successfully',
                data: checkoutData
            });

        } catch (error) {
            console.error('Error in prepareCheckout:', error);

            if (error.message.includes('empty') ||
                error.message.includes('invalid items')) {
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

    // Create order from cart (simplified checkout)
    checkout: async (req, res) => {
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

            const orderData = {
                customer_name: req.body.customer_name,
                customer_email: req.body.customer_email,
                customer_phone: req.body.customer_phone,
                billing_address: req.body.billing_address,
                shipping_address: req.body.shipping_address,
                payment_method: req.body.payment_method || 'cod',
                coupon_code: req.body.coupon_code,
                notes: req.body.notes
            };

            const order = await Cart.createOrderFromCart(orderData, userId, sessionId);

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: order
            });

        } catch (error) {
            console.error('Error in checkout:', error);

            if (error.message.includes('empty') ||
                error.message.includes('invalid') ||
                error.message.includes('stock')) {
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

    // Sync cart with inventory
    syncInventory: async (req, res) => {
        try {
            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];

            const syncResult = await Cart.syncWithInventory(userId, sessionId);

            res.json({
                success: true,
                message: `Cart synced successfully. ${syncResult.total_changes} changes made.`,
                data: syncResult
            });

        } catch (error) {
            console.error('Error in syncInventory:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get cart statistics
    getStatistics: async (req, res) => {
        try {
            const userId = req.user?.id || null;
            const sessionId = req.sessionID || req.headers['x-session-id'];

            const stats = await Cart.getCartStatistics(userId, sessionId);

            res.json({
                success: true,
                message: 'Cart statistics retrieved successfully',
                data: stats
            });

        } catch (error) {
            console.error('Error in getStatistics:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = cartController;