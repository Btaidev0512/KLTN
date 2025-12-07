const db = require('../config/database');

class ProductColor {
    // Get all colors for a product
    static async getByProductId(productId) {
        try {
            const [colors] = await db.execute(
                `SELECT * FROM product_colors 
                 WHERE product_id = ? 
                 ORDER BY sort_order ASC, color_id ASC`,
                [productId]
            );
            return colors;
        } catch (error) {
            throw new Error('Error getting product colors: ' + error.message);
        }
    }

    // Get color by ID
    static async getById(colorId) {
        try {
            const [colors] = await db.execute(
                'SELECT * FROM product_colors WHERE color_id = ?',
                [colorId]
            );
            return colors.length > 0 ? colors[0] : null;
        } catch (error) {
            throw new Error('Error getting color: ' + error.message);
        }
    }

    // Create new color
    static async create(colorData) {
        try {
            const { product_id, color_name, color_code, stock_quantity = 0, sort_order = 0 } = colorData;
            
            const [result] = await db.execute(
                `INSERT INTO product_colors (product_id, color_name, color_code, stock_quantity, sort_order) 
                 VALUES (?, ?, ?, ?, ?)`,
                [product_id, color_name, color_code, stock_quantity, sort_order]
            );
            
            return { color_id: result.insertId, ...colorData };
        } catch (error) {
            throw new Error('Error creating color: ' + error.message);
        }
    }

    // Update color
    static async update(colorId, colorData) {
        try {
            const { color_name, color_code, stock_quantity, sort_order, is_active } = colorData;
            
            const updates = [];
            const values = [];
            
            if (color_name !== undefined) {
                updates.push('color_name = ?');
                values.push(color_name);
            }
            if (color_code !== undefined) {
                updates.push('color_code = ?');
                values.push(color_code);
            }
            if (stock_quantity !== undefined) {
                updates.push('stock_quantity = ?');
                values.push(stock_quantity);
            }
            if (sort_order !== undefined) {
                updates.push('sort_order = ?');
                values.push(sort_order);
            }
            if (is_active !== undefined) {
                updates.push('is_active = ?');
                values.push(is_active);
            }
            
            if (updates.length === 0) {
                throw new Error('No fields to update');
            }
            
            values.push(colorId);
            
            await db.execute(
                `UPDATE product_colors SET ${updates.join(', ')} WHERE color_id = ?`,
                values
            );
            
            return await this.getById(colorId);
        } catch (error) {
            throw new Error('Error updating color: ' + error.message);
        }
    }

    // Delete color
    static async delete(colorId) {
        try {
            // 1. Xóa variants liên quan (vì có FK với product_colors)
            await db.execute(
                'DELETE FROM product_variants WHERE color_id = ?',
                [colorId]
            );
            
            // 2. Set color_id to NULL trong product_images
            await db.execute(
                'UPDATE product_images SET color_id = NULL WHERE color_id = ?',
                [colorId]
            );
            
            // 3. Xóa color
            await db.execute('DELETE FROM product_colors WHERE color_id = ?', [colorId]);
            return true;
        } catch (error) {
            throw new Error('Error deleting color: ' + error.message);
        }
    }

    // Get images by color
    static async getImagesByColor(productId, colorId) {
        try {
            const [images] = await db.execute(
                `SELECT * FROM product_images 
                 WHERE product_id = ? AND color_id = ?
                 ORDER BY is_primary DESC, sort_order ASC`,
                [productId, colorId]
            );
            return images;
        } catch (error) {
            throw new Error('Error getting images by color: ' + error.message);
        }
    }

    // Update sort orders for multiple colors
    static async updateSortOrders(orders) {
        try {
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                for (const { color_id, sort_order } of orders) {
                    await connection.execute(
                        'UPDATE product_colors SET sort_order = ? WHERE color_id = ?',
                        [sort_order, color_id]
                    );
                }

                await connection.commit();
                return true;
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            throw new Error('Error updating sort orders: ' + error.message);
        }
    }
}

module.exports = ProductColor;
