const db = require('../config/database');

class ProductImage {
    // Get all images for a product
    static async getByProductId(productId) {
        try {
            const [images] = await db.execute(
                `SELECT * FROM product_images 
                 WHERE product_id = ? 
                 ORDER BY is_primary DESC, sort_order ASC`,
                [productId]
            );
            return images;
        } catch (error) {
            throw new Error('Error getting product images: ' + error.message);
        }
    }

    // Get image by ID
    static async getById(imageId) {
        try {
            const [images] = await db.execute(
                'SELECT * FROM product_images WHERE image_id = ?',
                [imageId]
            );
            return images.length > 0 ? images[0] : null;
        } catch (error) {
            throw new Error('Error getting image: ' + error.message);
        }
    }

    // Create new image
    static async create(imageData) {
        try {
            const { 
                product_id, 
                image_url, 
                is_primary = false, 
                color_id = null, 
                sort_order = 0 
            } = imageData;
            
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // If setting as primary, unset other primary images
                if (is_primary) {
                    await connection.execute(
                        'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
                        [product_id]
                    );
                }

                const [result] = await connection.execute(
                    `INSERT INTO product_images (product_id, image_url, is_primary, color_id, sort_order) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [product_id, image_url, is_primary, color_id, sort_order]
                );

                await connection.commit();
                return { image_id: result.insertId, ...imageData };
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            throw new Error('Error creating image: ' + error.message);
        }
    }

    // Update image
    static async update(imageId, imageData) {
        try {
            const { is_primary, color_id, sort_order } = imageData;
            
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // Get product_id first
                const [currentImage] = await connection.execute(
                    'SELECT product_id FROM product_images WHERE image_id = ?',
                    [imageId]
                );

                if (currentImage.length === 0) {
                    throw new Error('Image not found');
                }

                const productId = currentImage[0].product_id;

                // If setting as primary, unset other primary images
                if (is_primary === true) {
                    await connection.execute(
                        'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
                        [productId]
                    );
                }

                const updates = [];
                const values = [];
                
                if (is_primary !== undefined) {
                    updates.push('is_primary = ?');
                    values.push(is_primary);
                }
                if (color_id !== undefined) {
                    updates.push('color_id = ?');
                    values.push(color_id);
                }
                if (sort_order !== undefined) {
                    updates.push('sort_order = ?');
                    values.push(sort_order);
                }
                
                if (updates.length > 0) {
                    values.push(imageId);
                    await connection.execute(
                        `UPDATE product_images SET ${updates.join(', ')} WHERE image_id = ?`,
                        values
                    );
                }

                await connection.commit();
                return await this.getById(imageId);
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            throw new Error('Error updating image: ' + error.message);
        }
    }

    // Delete image
    static async delete(imageId) {
        try {
            await db.execute('DELETE FROM product_images WHERE image_id = ?', [imageId]);
            return true;
        } catch (error) {
            throw new Error('Error deleting image: ' + error.message);
        }
    }

    // Get images by color
    static async getByColor(productId, colorId) {
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
}

module.exports = ProductImage;
