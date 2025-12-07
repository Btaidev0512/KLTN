const db = require('../config/database');

class Banner {
    // Get all banners (admin - include inactive)
    static async findAll(includeInactive = false) {
        try {
            let query = 'SELECT * FROM banners';
            if (!includeInactive) {
                query += ' WHERE is_active = 1';
            }
            query += ' ORDER BY sort_order ASC, created_at DESC';
            
            const [banners] = await db.execute(query);
            return banners;
        } catch (error) {
            console.error('Error fetching banners:', error);
            throw error;
        }
    }

    // Get active banners only (for frontend)
    static async getActive() {
        try {
            const query = `
                SELECT banner_id, title, subtitle, tag_text, tag_type, 
                       button_text, button_link, background_image, background_gradient, 
                       sort_order
                FROM banners 
                WHERE is_active = 1 
                ORDER BY sort_order ASC
            `;
            const [banners] = await db.execute(query);
            return banners;
        } catch (error) {
            console.error('Error fetching active banners:', error);
            throw error;
        }
    }

    // Get banner by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM banners WHERE banner_id = ?';
            const [banners] = await db.execute(query, [id]);
            return banners.length > 0 ? banners[0] : null;
        } catch (error) {
            console.error('Error fetching banner by ID:', error);
            throw error;
        }
    }

    // Create new banner
    static async create(bannerData) {
        try {
            const {
                title,
                subtitle,
                tag_text,
                tag_type,
                button_text,
                button_link,
                background_image,
                background_gradient,
                is_active = 1,
                sort_order = 0
            } = bannerData;

            const query = `
                INSERT INTO banners 
                (title, subtitle, tag_text, tag_type, button_text, button_link, 
                 background_image, background_gradient, is_active, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.execute(query, [
                title,
                subtitle || null,
                tag_text || null,
                tag_type || null,
                button_text,
                button_link,
                background_image || null,
                background_gradient,
                is_active,
                sort_order
            ]);

            return {
                banner_id: result.insertId,
                ...bannerData
            };
        } catch (error) {
            console.error('Error creating banner:', error);
            throw error;
        }
    }

    // Update banner
    static async update(id, bannerData) {
        try {
            const {
                title,
                subtitle,
                tag_text,
                tag_type,
                button_text,
                button_link,
                background_image,
                background_gradient,
                is_active,
                sort_order
            } = bannerData;

            const query = `
                UPDATE banners 
                SET title = ?, 
                    subtitle = ?, 
                    tag_text = ?, 
                    tag_type = ?, 
                    button_text = ?, 
                    button_link = ?,
                    background_image = ?, 
                    background_gradient = ?, 
                    is_active = ?, 
                    sort_order = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE banner_id = ?
            `;

            const [result] = await db.execute(query, [
                title,
                subtitle || null,
                tag_text || null,
                tag_type || null,
                button_text,
                button_link,
                background_image || null,
                background_gradient,
                is_active,
                sort_order,
                id
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating banner:', error);
            throw error;
        }
    }

    // Toggle active status
    static async toggleActive(id) {
        try {
            const query = `
                UPDATE banners 
                SET is_active = NOT is_active,
                    updated_at = CURRENT_TIMESTAMP
                WHERE banner_id = ?
            `;
            const [result] = await db.execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error toggling banner status:', error);
            throw error;
        }
    }

    // Update sort order
    static async updateSortOrder(id, newOrder) {
        try {
            const query = `
                UPDATE banners 
                SET sort_order = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE banner_id = ?
            `;
            const [result] = await db.execute(query, [newOrder, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating banner sort order:', error);
            throw error;
        }
    }

    // Batch update sort orders
    static async batchUpdateSortOrder(banners) {
        try {
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                for (const banner of banners) {
                    await connection.execute(
                        'UPDATE banners SET sort_order = ? WHERE banner_id = ?',
                        [banner.sort_order, banner.banner_id]
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
            console.error('Error batch updating sort orders:', error);
            throw error;
        }
    }

    // Delete banner
    static async delete(id) {
        try {
            const query = 'DELETE FROM banners WHERE banner_id = ?';
            const [result] = await db.execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting banner:', error);
            throw error;
        }
    }
}

module.exports = Banner;
