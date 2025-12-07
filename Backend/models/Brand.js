const db = require('../config/database');
const slugify = require('slugify');

class Brand {
    // Create new brand
    static async create(brandData, category_ids = []) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const { 
                name, 
                description, 
                logo_url, 
                website_url, 
                country, 
                established_year, 
                sort_order = 0,
                meta_title,
                meta_description,
                category_id // Keep for backward compatibility
            } = brandData;
            
            // Generate slug from name
            const slug = slugify(name, { 
                lower: true, 
                strict: true,
                locale: 'vi'
            });
            
            const query = `
                INSERT INTO brands (
                    brand_name, brand_slug, description, logo_url, website_url,
                    country, established_year, sort_order, meta_title, meta_description, category_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await connection.execute(query, [
                name, 
                slug, 
                description || null, 
                logo_url || null, 
                website_url || null,
                country || null, 
                established_year || null, 
                sort_order || 0, 
                meta_title || null, 
                meta_description || null, 
                category_id || null
            ]);
            
            const brandId = result.insertId;
            
            // Insert into brand_categories if category_ids provided
            if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
                const values = category_ids.map(catId => [brandId, catId]);
                await connection.query(
                    'INSERT INTO brand_categories (brand_id, category_id) VALUES ?',
                    [values]
                );
            } else if (category_id) {
                // Fallback: use single category_id if provided
                await connection.execute(
                    'INSERT INTO brand_categories (brand_id, category_id) VALUES (?, ?)',
                    [brandId, category_id]
                );
            }
            
            await connection.commit();
            return brandId;
        } catch (error) {
            await connection.rollback();
            console.error('Create brand error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get all brands with pagination
    static async findAll(options = {}) {
        try {
            const {
                page = 1,
                limit = 50,
                search = '',
                is_active = null,
                country = null
            } = options;

            const offset = (page - 1) * limit;
            let query = `
                SELECT 
                    b.brand_id, 
                    b.brand_name, 
                    b.brand_slug,
                    b.category_id,
                    c.category_name, 
                    b.description, 
                    b.logo_url, 
                    b.website_url, 
                    b.country, 
                    b.established_year, 
                    b.is_active, 
                    b.sort_order,
                    b.meta_title, 
                    b.meta_description, 
                    b.created_at, 
                    b.updated_at,
                    COUNT(DISTINCT p.product_id) as product_count,
                    GROUP_CONCAT(DISTINCT cat.category_name ORDER BY cat.category_name) as categories,
                    GROUP_CONCAT(DISTINCT bc.category_id ORDER BY bc.category_id) as category_ids
                FROM brands b
                LEFT JOIN categories c ON b.category_id = c.category_id
                LEFT JOIN products p ON b.brand_id = p.brand_id
                LEFT JOIN brand_categories bc ON b.brand_id = bc.brand_id
                LEFT JOIN categories cat ON bc.category_id = cat.category_id
                WHERE 1=1
            `;
            let params = [];

            // Search filter
            if (search) {
                query += ` AND (b.brand_name LIKE ? OR b.description LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`);
            }

            // Active filter
            if (is_active !== null) {
                query += ` AND b.is_active = ?`;
                params.push(is_active);
            }

            // Country filter
            if (country) {
                query += ` AND b.country = ?`;
                params.push(country);
            }

            // Group by
            query += ` GROUP BY b.brand_id, b.brand_name, b.brand_slug, b.category_id, c.category_name, 
                       b.description, b.logo_url, b.website_url, b.country, b.established_year, 
                       b.is_active, b.sort_order, b.meta_title, b.meta_description, 
                       b.created_at, b.updated_at`;

            // Order and pagination
            query += ` ORDER BY b.sort_order ASC, b.brand_name ASC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [brands] = await db.execute(query, params);
            
            // Parse category_ids from string to array for each brand
            brands.forEach(brand => {
                if (brand.category_ids) {
                    brand.category_ids = brand.category_ids.split(',').map(Number);
                } else {
                    brand.category_ids = brand.category_id ? [brand.category_id] : [];
                }
            });

            // Get total count
            let countQuery = `SELECT COUNT(*) as total FROM brands WHERE 1=1`;
            let countParams = [];

            if (search) {
                countQuery += ` AND (brand_name LIKE ? OR description LIKE ?)`;
                countParams.push(`%${search}%`, `%${search}%`);
            }

            if (is_active !== null) {
                countQuery += ` AND is_active = ?`;
                countParams.push(is_active);
            }

            if (country) {
                countQuery += ` AND country = ?`;
                countParams.push(country);
            }

            const [countResult] = await db.execute(countQuery, countParams);
            const total = countResult[0].total;

            return {
                brands,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Find all brands error:', error);
            throw error;
        }
    }

    // Get brand by ID
    static async findById(id) {
        try {
            const query = `
                SELECT b.brand_id, b.brand_name, b.brand_slug, b.description, b.logo_url, 
                       b.website_url, b.country, b.established_year, b.is_active, b.sort_order,
                       b.meta_title, b.meta_description, b.created_at, b.updated_at,
                       b.category_id,
                       GROUP_CONCAT(DISTINCT c.category_name) as categories,
                       GROUP_CONCAT(DISTINCT bc.category_id) as category_ids
                FROM brands b
                LEFT JOIN brand_categories bc ON b.brand_id = bc.brand_id
                LEFT JOIN categories c ON bc.category_id = c.category_id
                WHERE b.brand_id = ?
                GROUP BY b.brand_id
            `;
            
            const [rows] = await db.execute(query, [id]);
            if (rows[0]) {
                // Parse category_ids from string to array
                const brand = rows[0];
                if (brand.category_ids) {
                    brand.category_ids = brand.category_ids.split(',').map(Number);
                } else {
                    brand.category_ids = brand.category_id ? [brand.category_id] : [];
                }
            }
            return rows[0];
        } catch (error) {
            console.error('Find brand by ID error:', error);
            throw error;
        }
    }

    // Get brand by slug
    static async findBySlug(slug) {
        try {
            const query = `
                SELECT brand_id, brand_name, brand_slug, description, logo_url, 
                       website_url, country, established_year, is_active, sort_order,
                       meta_title, meta_description, created_at, updated_at
                FROM brands 
                WHERE brand_slug = ? AND is_active = true
            `;
            
            const [rows] = await db.execute(query, [slug]);
            return rows[0];
        } catch (error) {
            console.error('Find brand by slug error:', error);
            throw error;
        }
    }

    // Update brand
    static async update(id, updateData, category_ids = null) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const { 
                name, 
                description, 
                logo_url, 
                website_url, 
                country, 
                established_year,
                is_active,
                sort_order,
                meta_title,
                meta_description,
                category_id
            } = updateData;
            
            // Build dynamic query based on what fields are provided
            const updates = [];
            const params = [];
            
            if (name !== undefined && name !== null) {
                updates.push('brand_name = ?');
                params.push(name);
                
                // Generate slug from name
                const slug = slugify(name, { 
                    lower: true, 
                    strict: true,
                    locale: 'vi'
                });
                updates.push('brand_slug = ?');
                params.push(slug);
            }
            
            if (category_id !== undefined) {
                updates.push('category_id = ?');
                params.push(category_id);
            }
            
            if (description !== undefined) {
                updates.push('description = ?');
                params.push(description);
            }
            
            if (logo_url !== undefined) {
                updates.push('logo_url = ?');
                params.push(logo_url);
            }
            
            if (website_url !== undefined) {
                updates.push('website_url = ?');
                params.push(website_url);
            }
            
            if (country !== undefined) {
                updates.push('country = ?');
                params.push(country);
            }
            
            if (established_year !== undefined) {
                updates.push('established_year = ?');                params.push(established_year);
            }
            
            if (is_active !== undefined) {
                updates.push('is_active = ?');
                params.push(is_active);
            }
            
            if (sort_order !== undefined) {
                updates.push('sort_order = ?');
                params.push(sort_order);
            }
            
            if (meta_title !== undefined) {
                updates.push('meta_title = ?');
                params.push(meta_title);
            }
            
            if (meta_description !== undefined) {
                updates.push('meta_description = ?');
                params.push(meta_description);
            }
            
            if (updates.length === 0 && category_ids === null) {
                await connection.commit();
                return true; // Nothing to update
            }
            
            // Update brands table if there are changes
            if (updates.length > 0) {
                updates.push('updated_at = CURRENT_TIMESTAMP');
                params.push(id);
                
                const query = `UPDATE brands SET ${updates.join(', ')} WHERE brand_id = ?`;
                await connection.execute(query, params);
            }
            
            // Update brand_categories if category_ids provided
            if (category_ids !== null && Array.isArray(category_ids)) {
                // Delete existing mappings
                await connection.execute('DELETE FROM brand_categories WHERE brand_id = ?', [id]);
                
                // Insert new mappings
                if (category_ids.length > 0) {
                    const values = category_ids.map(catId => [id, catId]);
                    await connection.query(
                        'INSERT INTO brand_categories (brand_id, category_id) VALUES ?',
                        [values]
                    );
                }
            }
            
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('Update brand error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Delete brand (soft delete)
    static async delete(id) {
        try {
            const query = `UPDATE brands SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE brand_id = ?`;
            const [result] = await db.execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Delete brand error:', error);
            throw error;
        }
    }

    // Get popular brands (used in many products)
    static async getPopular(limit = 10) {
        try {
            const query = `
                SELECT b.brand_id, b.brand_name, b.brand_slug, b.logo_url,
                       COUNT(p.product_id) as product_count
                FROM brands b
                LEFT JOIN products p ON b.brand_id = p.brand_id
                WHERE b.is_active = true
                GROUP BY b.brand_id
                ORDER BY product_count DESC, b.brand_name ASC
                LIMIT ?
            `;
            
            const [rows] = await db.execute(query, [limit]);
            return rows;
        } catch (error) {
            console.error('Get popular brands error:', error);
            throw error;
        }
    }

    // Get brands by country
    static async getByCountry(country, limit = 20) {
        try {
            const query = `
                SELECT brand_id, brand_name, brand_slug, description, logo_url, 
                       website_url, country, established_year, created_at
                FROM brands 
                WHERE country = ? AND is_active = true
                ORDER BY sort_order ASC, brand_name ASC
                LIMIT ?
            `;
            
            const [rows] = await db.execute(query, [country, limit]);
            return rows;
        } catch (error) {
            console.error('Get brands by country error:', error);
            throw error;
        }
    }

    // Search brands
    static async search(searchTerm, limit = 20) {
        try {
            const query = `
                SELECT brand_id, brand_name, brand_slug, description, logo_url, 
                       website_url, country, established_year
                FROM brands 
                WHERE (brand_name LIKE ? OR description LIKE ?) 
                AND is_active = true
                ORDER BY brand_name ASC
                LIMIT ?
            `;
            
            const searchPattern = `%${searchTerm}%`;
            const [rows] = await db.execute(query, [searchPattern, searchPattern, limit]);
            return rows;
        } catch (error) {
            console.error('Search brands error:', error);
            throw error;
        }
    }

    // Get all countries with brands
    static async getCountries() {
        try {
            const query = `
                SELECT country, COUNT(*) as brand_count
                FROM brands 
                WHERE is_active = true AND country IS NOT NULL
                GROUP BY country
                ORDER BY brand_count DESC, country ASC
            `;
            
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            console.error('Get brand countries error:', error);
            throw error;
        }
    }

    // Update sort orders for multiple brands
    static async updateSortOrders(orders) {
        try {
            // Use transaction to ensure atomic updates
            const connection = await db.pool.getConnection();
            
            try {
                await connection.beginTransaction();
                
                for (const item of orders) {
                    await connection.execute(
                        'UPDATE brands SET sort_order = ? WHERE brand_id = ?',
                        [item.sort_order, item.id]
                    );
                }
                
                await connection.commit();
                connection.release();
                
                return true;
            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
        } catch (error) {
            console.error('Update sort orders error:', error);
            throw error;
        }
    }
}

module.exports = Brand;