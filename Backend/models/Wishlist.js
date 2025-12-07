const db = require('../config/database');

class Wishlist {
    static async addItem(userId, productId) {
        try {
            const [existing] = await db.execute(
                'SELECT wishlist_id FROM wishlists WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );

            if (existing.length > 0) {
                // Already exists, return existing record
                return { 
                    wishlist_id: existing[0].wishlist_id, 
                    user_id: userId, 
                    product_id: productId,
                    isNew: false
                };
            }

            const [result] = await db.execute(
                'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
                [userId, productId]
            );

            return { 
                wishlist_id: result.insertId, 
                user_id: userId, 
                product_id: productId,
                isNew: true
            };
        } catch (error) {
            throw new Error('Error adding to wishlist: ' + error.message);
        }
    }

    static async removeItem(userId, productId) {
        try {
            const [result] = await db.execute(
                'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw new Error('Error removing from wishlist: ' + error.message);
        }
    }

    static async getUserWishlist(userId, page = 1, limit = 10) {
        try {
            console.log('🔍 Wishlist.getUserWishlist called with:', { userId, page, limit });
            const offset = (page - 1) * limit;
            
            const [items] = await db.execute(`
                SELECT 
                    w.wishlist_id,
                    w.product_id,
                    w.created_at as added_at,
                    p.product_name,
                    p.product_slug,
                    (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as product_image,
                    p.base_price,
                    p.sale_price,
                    p.stock_quantity,
                    p.status as product_status,
                    COALESCE(p.sale_price, p.base_price) as final_price
                FROM wishlists w
                LEFT JOIN products p ON w.product_id = p.product_id
                WHERE w.user_id = ?
                ORDER BY w.created_at DESC
                LIMIT ? OFFSET ?
            `, [userId, limit, offset]);

            console.log('📊 Query returned:', items.length, 'items');

            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM wishlists WHERE user_id = ?',
                [userId]
            );

            console.log('📈 Total count:', countResult[0].total);

            return { 
                items, 
                total: countResult[0].total,
                page,
                limit
            };
        } catch (error) {
            console.error('❌ Wishlist.getUserWishlist error:', error);
            throw new Error('Error getting wishlist: ' + error.message);
        }
    }

    static async isInWishlist(userId, productId) {
        try {
            const [items] = await db.execute(
                'SELECT wishlist_id FROM wishlists WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );
            return items.length > 0;
        } catch (error) {
            throw new Error('Error checking wishlist: ' + error.message);
        }
    }

    static async getCount(userId) {
        try {
            const [result] = await db.execute(
                'SELECT COUNT(*) as count FROM wishlists WHERE user_id = ?',
                [userId]
            );
            return result[0].count;
        } catch (error) {
            throw new Error('Error getting wishlist count: ' + error.message);
        }
    }
}

module.exports = Wishlist;
