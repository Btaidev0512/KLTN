const db = require('../config/database');

class Cart {
    // Get cart items for user or session
    static async getItems(userId = null, sessionId = null) {
        try {
            let query = `
                SELECT 
                    sc.id as cart_id,
                    sc.quantity,
                    sc.unit_price,
                    sc.selected_attributes,
                    sc.created_at,
                    p.product_id,
                    p.product_name,
                    p.product_slug,
                    p.base_price as current_price,
                    p.sale_price as current_sale_price,
                    COALESCE(p.sale_price, p.base_price) as current_final_price,
                    p.track_quantity,
                    p.status as product_status,
                    b.brand_name,
                    pi.image_url as product_image,
                    (sc.quantity * sc.unit_price) as item_total
                FROM shopping_cart sc
                LEFT JOIN products p ON sc.product_id = p.product_id
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
                WHERE 1=1
            `;
            
            let params = [];

            if (userId) {
                query += ` AND sc.user_id = ?`;
                params.push(userId);
            } else if (sessionId) {
                query += ` AND sc.session_id = ? AND sc.user_id IS NULL`;
                params.push(sessionId);
            } else {
                return { items: [], summary: this.getEmptySummary() };
            }

            query += ` ORDER BY sc.created_at DESC`;

            const [items] = await db.execute(query, params);

            // Calculate cart summary
            const summary = this.calculateSummary(items);

            return { items, summary };
        } catch (error) {
            throw new Error(`Error getting cart items: ${error.message}`);
        }
    }

    // Add item to cart
    static async addItem(itemData) {
        try {
            const {
                user_id = null,
                session_id = null,
                product_id,
                quantity = 1,
                selected_attributes = null
            } = itemData;

            // Validate product exists and is active
            const [products] = await db.execute(
                'SELECT product_id, base_price, sale_price, track_quantity, status FROM products WHERE product_id = ?',
                [product_id]
            );

            if (products.length === 0) {
                throw new Error('Product not found');
            }

            const product = products[0];

            if (product.status !== 'active') {
                throw new Error('Product is not available');
            }

            // Note: Stock quantity check removed as products table doesn't have stock_quantity column
            
            const unit_price = product.sale_price || product.base_price;

            // Check if item already exists in cart
            let existingQuery = `
                SELECT id, quantity 
                FROM shopping_cart 
                WHERE product_id = ?
            `;
            let existingParams = [product_id];

            if (user_id) {
                existingQuery += ` AND user_id = ? AND session_id IS NULL`;
                existingParams.push(user_id);
            } else if (session_id) {
                existingQuery += ` AND session_id = ? AND user_id IS NULL`;
                existingParams.push(session_id);
            }

            // Add attributes to check if provided
            if (selected_attributes) {
                existingQuery += ` AND JSON_EXTRACT(selected_attributes, '$') = JSON_EXTRACT(?, '$')`;
                existingParams.push(JSON.stringify(selected_attributes));
            } else {
                existingQuery += ` AND (selected_attributes IS NULL OR selected_attributes = 'null' OR selected_attributes = '{}')`;
            }

            console.log('🔍 Checking existing cart item:', {
                query: existingQuery,
                params: existingParams
            });

            const [existingItems] = await db.execute(existingQuery, existingParams);

            console.log('🔍 Found existing items:', existingItems);

            if (existingItems.length > 0) {
                // Update existing item quantity
                const newQuantity = existingItems[0].quantity + quantity;
                
                console.log('✅ Updating existing cart item:', {
                    cart_id: existingItems[0].id,
                    old_quantity: existingItems[0].quantity,
                    add_quantity: quantity,
                    new_quantity: newQuantity
                });
                
                // Note: Stock quantity check removed as products table doesn't have stock_quantity column
                
                await db.execute(
                    'UPDATE shopping_cart SET quantity = ?, unit_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [newQuantity, unit_price, existingItems[0].id]
                );

                return await this.getItemById(existingItems[0].id);
            } else {
                // Insert new item
                console.log('➕ Inserting new cart item:', {
                    user_id,
                    session_id,
                    product_id,
                    quantity,
                    unit_price,
                    selected_attributes
                });
                
                const insertQuery = `
                    INSERT INTO shopping_cart (user_id, session_id, product_id, quantity, unit_price, selected_attributes)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                const [result] = await db.execute(insertQuery, [
                    user_id, session_id, product_id, quantity, unit_price,
                    selected_attributes ? JSON.stringify(selected_attributes) : null
                ]);

                console.log('✅ New cart item inserted, ID:', result.insertId);

                return await this.getItemById(result.insertId);
            }
        } catch (error) {
            throw new Error(`Error adding item to cart: ${error.message}`);
        }
    }

    // Update cart item quantity
    static async updateItem(cartId, quantity, userId = null, sessionId = null) {
        try {
            if (quantity <= 0) {
                return await this.removeItem(cartId, userId, sessionId);
            }

            // Validate cart item ownership  
            let ownershipQuery = 'SELECT sc.* FROM shopping_cart sc WHERE sc.id = ?';
            let ownershipParams = [cartId];

            if (userId) {
                ownershipQuery += ' AND sc.user_id = ?';
                ownershipParams.push(userId);
            } else {
                ownershipQuery += ' AND sc.session_id = ? AND sc.user_id IS NULL';
                ownershipParams.push(sessionId);
            }

            const [cartItems] = await db.execute(ownershipQuery, ownershipParams);

            if (cartItems.length === 0) {
                throw new Error('Cart item not found');
            }

            const cartItem = cartItems[0];

            // Note: Stock quantity check removed as products table doesn't have stock_quantity column
            
            await db.execute(
                'UPDATE shopping_cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [quantity, cartId]
            );

            return await this.getItemById(cartId);
        } catch (error) {
            throw new Error(`Error updating cart item: ${error.message}`);
        }
    }

    // Remove item from cart
    static async removeItem(cartId, userId = null, sessionId = null) {
        try {
            let query = 'DELETE FROM shopping_cart WHERE id = ?';
            let params = [cartId];

            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            } else {
                query += ' AND session_id = ? AND user_id IS NULL';
                params.push(sessionId);
            }

            const [result] = await db.execute(query, params);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error removing cart item: ${error.message}`);
        }
    }

    // Clear cart
    static async clearCart(userId = null, sessionId = null) {
        try {
            let query = 'DELETE FROM shopping_cart WHERE 1=1';
            let params = [];

            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            } else if (sessionId) {
                query += ' AND session_id = ? AND user_id IS NULL';
                params.push(sessionId);
            }

            const [result] = await db.execute(query, params);
            return result.affectedRows;
        } catch (error) {
            throw new Error(`Error clearing cart: ${error.message}`);
        }
    }

    // Transfer guest cart to user cart (after login)
    static async transferGuestCart(sessionId, userId) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Get guest cart items
            const [guestItems] = await connection.execute(
                'SELECT * FROM shopping_cart WHERE session_id = ? AND user_id IS NULL',
                [sessionId]
            );

            for (const item of guestItems) {
                // Check if user already has this product in cart
                const [existingItems] = await connection.execute(
                    'SELECT id, quantity FROM shopping_cart WHERE user_id = ? AND product_id = ? AND JSON_EXTRACT(selected_attributes, "$") = JSON_EXTRACT(?, "$")',
                    [userId, item.product_id, item.selected_attributes || 'null']
                );

                if (existingItems.length > 0) {
                    // Merge quantities
                    await connection.execute(
                        'UPDATE shopping_cart SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [item.quantity, existingItems[0].id]
                    );
                } else {
                    // Transfer item to user
                    await connection.execute(
                        'UPDATE shopping_cart SET user_id = ?, session_id = NULL WHERE id = ?',
                        [userId, item.id]
                    );
                }
            }

            // Remove any remaining guest items
            await connection.execute(
                'DELETE FROM shopping_cart WHERE session_id = ? AND user_id IS NULL',
                [sessionId]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw new Error(`Error transferring guest cart: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    // Helper: Get single cart item by ID
    static async getItemById(cartId) {
        try {
            const query = `
                SELECT 
                    sc.*,
                    p.product_name,
                    p.product_slug,
                    p.base_price as current_price,
                    p.sale_price as current_sale_price,
                    COALESCE(p.sale_price, p.base_price) as current_final_price,
                    pi.image_url as product_image
                FROM shopping_cart sc
                LEFT JOIN products p ON sc.product_id = p.product_id
                LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
                WHERE sc.id = ?
            `;

            const [items] = await db.execute(query, [cartId]);
            return items[0] || null;
        } catch (error) {
            throw new Error(`Error getting cart item: ${error.message}`);
        }
    }

    // Helper: Calculate cart summary
    static calculateSummary(items) {
        const summary = {
            total_items: 0,
            total_quantity: 0,
            subtotal: 0,
            estimated_tax: 0,
            estimated_shipping: 0,
            estimated_total: 0,
            currency: 'VND'
        };

        items.forEach(item => {
            if (item.product_status === 'active') {
                summary.total_items += 1;
                summary.total_quantity += item.quantity;
                summary.subtotal += (parseFloat(item.item_total) || 0);
            }
        });

        // Calculate estimated tax (10% VAT)
        summary.estimated_tax = Math.round(summary.subtotal * 0.1);

        // Calculate estimated shipping - Free shipping over 1M VND
        if (summary.subtotal >= 1000000) {
            summary.estimated_shipping = 0;
        } else if (summary.subtotal >= 500000) {
            summary.estimated_shipping = 30000; // 30k VND
        } else if (summary.subtotal > 0) {
            summary.estimated_shipping = 50000; // 50k VND
        } else {
            summary.estimated_shipping = 0;
        }

        summary.estimated_total = summary.subtotal + summary.estimated_tax + summary.estimated_shipping;

        return summary;
    }

    // Apply coupon to cart
    static async applyCoupon(couponCode, userId = null, sessionId = null) {
        const connection = await db.pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Get cart items first
            const { items, summary } = await this.getItems(userId, sessionId);
            
            if (items.length === 0) {
                throw new Error('Cart is empty');
            }

            // Validate coupon
            const [coupons] = await connection.execute(`
                SELECT * FROM coupons 
                WHERE coupon_code = ? 
                AND is_active = true 
                AND (valid_from IS NULL OR valid_from <= NOW())
                AND (valid_until IS NULL OR valid_until >= NOW())
                AND (usage_limit_per_coupon IS NULL OR used_count < usage_limit_per_coupon)
            `, [couponCode]);

            if (coupons.length === 0) {
                throw new Error('Coupon is not valid or has expired');
            }

            const coupon = coupons[0];

            // Check minimum order amount
            if (coupon.minimum_order_amount && summary.subtotal < coupon.minimum_order_amount) {
                throw new Error(`Minimum order amount of ${coupon.minimum_order_amount} required for this coupon`);
            }

            // Check if user already used this coupon (per customer limit)
            if (userId && coupon.usage_limit_per_customer) {
                const [userUsage] = await connection.execute(`
                    SELECT COUNT(*) as usage_count 
                    FROM orders 
                    WHERE user_id = ? AND coupon_id = ? AND status != 'cancelled'
                `, [userId, coupon.coupon_id]);

                if (userUsage[0].usage_count >= coupon.usage_limit_per_customer) {
                    throw new Error('You have reached the usage limit for this coupon');
                }
            }

            // Calculate discount
            let discountAmount = 0;
            const discountValue = parseFloat(coupon.discount_value);
            
            console.log('🎫 Coupon details:', {
                code: coupon.coupon_code,
                type: coupon.discount_type,
                value: discountValue,
                subtotal: summary.subtotal
            });
            
            if (coupon.discount_type === 'percentage') {
                discountAmount = Math.round(summary.subtotal * (discountValue / 100));
                if (coupon.maximum_discount_amount) {
                    discountAmount = Math.min(discountAmount, parseFloat(coupon.maximum_discount_amount));
                }
                console.log(`💰 Percentage discount: ${discountValue}% of ${summary.subtotal} = ${discountAmount}`);
            } else if (coupon.discount_type === 'fixed_amount') {
                discountAmount = discountValue;
                console.log(`💰 Fixed discount: ${discountAmount}`);
            } else {
                discountAmount = discountValue;
            }

            // Make sure discount doesn't exceed subtotal
            discountAmount = Math.min(discountAmount, summary.subtotal);

            await connection.commit();

            return {
                coupon: {
                    id: coupon.coupon_id,
                    code: coupon.coupon_code,
                    description: coupon.description,
                    discount_type: coupon.discount_type,
                    discount_value: coupon.discount_value,
                    discount_amount: discountAmount
                },
                updated_summary: {
                    ...summary,
                    discount_amount: discountAmount,
                    estimated_total: summary.subtotal + summary.estimated_tax + summary.estimated_shipping - discountAmount
                }
            };

        } catch (error) {
            await connection.rollback();
            throw new Error(`Error applying coupon: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    // Validate cart items before checkout
    static async validateCartForCheckout(userId = null, sessionId = null) {
        try {
            const { items } = await this.getItems(userId, sessionId);
            
            if (items.length === 0) {
                throw new Error('Cart is empty');
            }

            const validationResults = [];
            let hasInvalidItems = false;

            for (const item of items) {
                const result = {
                    cart_id: item.cart_id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    requested_quantity: item.quantity,
                    valid: true,
                    issues: []
                };

                // Check if product is still active
                if (item.product_status !== 'active') {
                    result.valid = false;
                    result.issues.push('Product is no longer available');
                    hasInvalidItems = true;
                }

                // Check stock availability
                if (item.stock_quantity < item.quantity) {
                    result.valid = false;
                    result.issues.push(`Only ${item.stock_quantity} items in stock`);
                    result.available_quantity = item.stock_quantity;
                    hasInvalidItems = true;
                }

                // Check price changes
                if (item.current_final_price !== item.unit_price) {
                    result.price_changed = true;
                    result.old_price = item.unit_price;
                    result.new_price = item.current_final_price;
                }

                validationResults.push(result);
            }

            return {
                valid: !hasInvalidItems,
                items: validationResults,
                total_items: items.length,
                invalid_items: validationResults.filter(item => !item.valid).length
            };

        } catch (error) {
            throw new Error(`Error validating cart: ${error.message}`);
        }
    }

    // Update cart item prices to current prices
    static async updateCartPrices(userId = null, sessionId = null) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            const { items } = await this.getItems(userId, sessionId);
            
            let updatedCount = 0;
            
            for (const item of items) {
                if (item.current_final_price !== item.unit_price) {
                    await connection.execute(
                        'UPDATE shopping_cart SET unit_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [item.current_final_price, item.cart_id]
                    );
                    updatedCount++;
                }
            }

            await connection.commit();
            return updatedCount;

        } catch (error) {
            await connection.rollback();
            throw new Error(`Error updating cart prices: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    // Prepare cart data for checkout
    static async prepareCheckout(userId = null, sessionId = null, couponCode = null) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Get and validate cart items
            const validation = await this.validateCartForCheckout(userId, sessionId);
            
            if (!validation.valid) {
                throw new Error('Cart contains invalid items');
            }

            const { items, summary } = await this.getItems(userId, sessionId);
            
            let checkoutData = {
                items: items.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    selected_attributes: item.selected_attributes,
                    item_total: item.quantity * item.unit_price
                })),
                summary: summary,
                coupon: null,
                final_total: summary.estimated_total
            };

            // Apply coupon if provided
            if (couponCode) {
                try {
                    const couponResult = await this.applyCoupon(couponCode, userId, sessionId);
                    checkoutData.coupon = couponResult.coupon;
                    checkoutData.summary = couponResult.updated_summary;
                    checkoutData.final_total = couponResult.updated_summary.estimated_total;
                } catch (couponError) {
                    // If coupon fails, continue without coupon but log the error
                    console.warn('Coupon application failed during checkout preparation:', couponError.message);
                }
            }

            await connection.commit();
            return checkoutData;

        } catch (error) {
            await connection.rollback();
            throw new Error(`Error preparing checkout: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    // Create order from cart (simplified version)
    static async createOrderFromCart(orderData, userId = null, sessionId = null) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Prepare checkout data
            const checkoutData = await this.prepareCheckout(userId, sessionId, orderData.coupon_code);
            
            if (checkoutData.items.length === 0) {
                throw new Error('Cart is empty');
            }

            // Generate unique order number
            const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            // Create order
            const orderInsertData = [
                userId,
                orderNumber,
                orderData.customer_name || null,
                orderData.customer_email || null,
                orderData.customer_phone || null,
                JSON.stringify({
                    billing_address: orderData.billing_address,
                    shipping_address: orderData.shipping_address
                }),
                checkoutData.summary.subtotal,
                checkoutData.summary.estimated_tax,
                checkoutData.summary.estimated_shipping,
                checkoutData.coupon?.discount_amount || 0,
                checkoutData.final_total,
                'pending', // status
                'pending', // payment_status
                orderData.payment_method || 'cod',
                orderData.notes || null,
                checkoutData.coupon?.id || null
            ];

            const [orderResult] = await connection.execute(`
                INSERT INTO orders (
                    user_id, order_number, customer_name, customer_email, customer_phone,
                    addresses, subtotal, tax_amount, shipping_cost, discount_amount, total_amount,
                    status, payment_status, payment_method, notes, coupon_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, orderInsertData);

            const orderId = orderResult.insertId;

            // Create order items
            for (const item of checkoutData.items) {
                await connection.execute(`
                    INSERT INTO order_items (
                        order_id, product_id, quantity, unit_price, selected_attributes, total_price
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.selected_attributes ? JSON.stringify(item.selected_attributes) : null,
                    item.item_total
                ]);

                // Update product stock
                await connection.execute(
                    'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            // Update coupon usage if used
            if (checkoutData.coupon) {
                await connection.execute(
                    'UPDATE coupons SET used_count = used_count + 1 WHERE coupon_id = ?',
                    [checkoutData.coupon.id]
                );
            }

            // Clear cart after successful order creation
            await this.clearCart(userId, sessionId);

            await connection.commit();

            return {
                order_id: orderId,
                order_number: orderNumber,
                total_amount: checkoutData.final_total,
                items_count: checkoutData.items.length
            };

        } catch (error) {
            await connection.rollback();
            throw new Error(`Error creating order: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    // Sync cart with inventory (remove out-of-stock items, adjust quantities)
    static async syncWithInventory(userId = null, sessionId = null) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            const { items } = await this.getItems(userId, sessionId);
            let removedItems = 0;
            let adjustedItems = 0;

            for (const item of items) {
                // Remove items for inactive products
                if (item.product_status !== 'active') {
                    await connection.execute(
                        'DELETE FROM shopping_cart WHERE id = ?',
                        [item.cart_id]
                    );
                    removedItems++;
                    continue;
                }

                // Adjust quantities for insufficient stock
                if (item.stock_quantity < item.quantity) {
                    if (item.stock_quantity === 0) {
                        // Remove if no stock
                        await connection.execute(
                            'DELETE FROM shopping_cart WHERE id = ?',
                            [item.cart_id]
                        );
                        removedItems++;
                    } else {
                        // Adjust to available stock
                        await connection.execute(
                            'UPDATE shopping_cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                            [item.stock_quantity, item.cart_id]
                        );
                        adjustedItems++;
                    }
                }
            }

            await connection.commit();

            return {
                removed_items: removedItems,
                adjusted_items: adjustedItems,
                total_changes: removedItems + adjustedItems
            };

        } catch (error) {
            await connection.rollback();
            throw new Error(`Error syncing cart with inventory: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    // Get cart statistics
    static async getCartStatistics(userId = null, sessionId = null) {
        try {
            const { items, summary } = await this.getItems(userId, sessionId);

            const stats = {
                ...summary,
                items_by_brand: {},
                price_range: {
                    min: 0,
                    max: 0,
                    average: 0
                },
                out_of_stock_items: 0,
                price_changed_items: 0,
                currency: 'VND'
            };

            if (items.length === 0) {
                return stats;
            }

            let prices = [];
            
            items.forEach(item => {
                // Group by brand
                if (item.brand_name) {
                    stats.items_by_brand[item.brand_name] = (stats.items_by_brand[item.brand_name] || 0) + 1;
                }

                // Track prices
                prices.push(item.unit_price);

                // Check stock issues
                if (item.stock_quantity === 0 || item.product_status !== 'active') {
                    stats.out_of_stock_items++;
                }

                // Check price changes
                if (item.current_final_price !== item.unit_price) {
                    stats.price_changed_items++;
                }
            });

            // Calculate price statistics
            if (prices.length > 0) {
                stats.price_range.min = Math.min(...prices);
                stats.price_range.max = Math.max(...prices);
                stats.price_range.average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
            }

            return stats;

        } catch (error) {
            throw new Error(`Error getting cart statistics: ${error.message}`);
        }
    }

    // Helper: Get empty cart summary
    static getEmptySummary() {
        return {
            total_items: 0,
            total_quantity: 0,
            subtotal: 0,
            estimated_tax: 0,
            estimated_shipping: 0,
            estimated_total: 0,
            currency: 'VND'
        };
    }
}

module.exports = Cart;