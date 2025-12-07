const db = require('../config/database');

class Product {
    static async getById(productId) {
        try {
            const [products] = await db.execute('SELECT * FROM products WHERE product_id = ?', [productId]);
            return products.length > 0 ? products[0] : null;
        } catch (error) {
            throw new Error('Error getting product: ' + error.message);
        }
    }

    // Get product by slug
    static async getBySlug(slug) {
        try {
            const [products] = await db.execute(
                `SELECT p.*, 
                        c.category_name,
                        b.brand_name,
                        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as image_url,
                        CASE 
                            WHEN p.sale_price > 0 AND p.sale_price < p.base_price 
                            THEN ROUND(((p.base_price - p.sale_price) / p.base_price) * 100, 0)
                            ELSE 0 
                        END as discount_percentage
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.category_id
                 LEFT JOIN brands b ON p.brand_id = b.brand_id
                 WHERE product_slug = ?`,
                [slug]
            );
            return products.length > 0 ? products[0] : null;
        } catch (error) {
            throw new Error('Error getting product by slug: ' + error.message);
        }
    }

    // 🎾 Get products by category name with filters
    static async getByCategory(options) {
        try {
            const {
                page = 1,
                limit = 20,
                category_name,
                min_price,
                max_price,
                brand_id,
                brands,
                status = 'active',
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = options;

            let query = `
                SELECT p.*, c.category_name, b.brand_name,
                       COUNT(*) OVER() as total_count
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                WHERE p.status = ? AND c.category_name = ?
            `;
            let params = [status, category_name];

            if (min_price) {
                query += ' AND p.base_price >= ?';
                params.push(min_price);
            }

            if (max_price) {
                query += ' AND p.base_price <= ?';
                params.push(max_price);
            }

            if (brand_id) {
                query += ' AND p.brand_id = ?';
                params.push(brand_id);
            }

            // Handle multiple brands filter by name
            if (brands && brands.length > 0) {
                query += ` AND b.brand_name IN (${brands.map(() => '?').join(',')})`;
                params.push(...brands);
            }

            const validSortFields = ['created_at', 'price', 'name', 'stock_quantity'];
            const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
            const sortDirection = ['ASC', 'DESC'].includes(sort_order) ? sort_order : 'DESC';

            query += ` ORDER BY p.${sortField} ${sortDirection}`;
            query += ' LIMIT ? OFFSET ?';
            params.push(limit, (page - 1) * limit);

            const [products] = await db.execute(query, params);

            const totalCount = products.length > 0 ? products[0].total_count : 0;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                products: products.map(p => {
                    const { total_count, ...product } = p;
                    return product;
                }),
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error('Error getting products by category: ' + error.message);
        }
    }

    // Get products by category slug
    static async getByCategorySlug(options) {
        try {
            const {
                page = 1,
                limit = 20,
                category_slug,
                min_price,
                max_price,
                brand_id,
                brands,
                status = 'active',
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = options;

            let query = `
                SELECT p.*, c.category_name, c.category_slug, b.brand_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as image_url,
                       COUNT(*) OVER() as total_count
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                WHERE p.status = ? AND c.category_slug = ?
            `;
            let params = [status, category_slug];

            if (min_price) {
                query += ' AND p.base_price >= ?';
                params.push(min_price);
            }

            if (max_price) {
                query += ' AND p.base_price <= ?';
                params.push(max_price);
            }

            if (brand_id) {
                query += ' AND p.brand_id = ?';
                params.push(brand_id);
            }

            // Handle multiple brands filter by name
            if (brands && brands.length > 0) {
                query += ` AND b.brand_name IN (${brands.map(() => '?').join(',')})`;
                params.push(...brands);
            }

            // Handle sorting
            const sortDirection = ['ASC', 'DESC'].includes(sort_order) ? sort_order : 'DESC';
            
            let orderByClause = '';
            switch (sort_by) {
                case 'base_price':
                case 'price':
                    orderByClause = `p.base_price ${sortDirection}`;
                    break;
                case 'product_name':
                case 'name':
                    orderByClause = `p.product_name ${sortDirection}`;
                    break;
                case 'stock_quantity':
                    orderByClause = `p.stock_quantity ${sortDirection}`;
                    break;
                case 'created_at':
                default:
                    orderByClause = `p.created_at ${sortDirection}`;
            }

            query += ` ORDER BY ${orderByClause}`;
            query += ' LIMIT ? OFFSET ?';
            params.push(limit, (page - 1) * limit);

            const [products] = await db.execute(query, params);

            const totalCount = products.length > 0 ? products[0].total_count : 0;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                products: products.map(p => {
                    const { total_count, ...product } = p;
                    return product;
                }),
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error('Error getting products by category slug: ' + error.message);
        }
    }

    // Get all products with comprehensive filtering
    static async getAll(options) {
        try {
            const {
                page = 1,
                limit = 20,
                search = '',
                category_id,
                brand_id,
                brands,
                min_price,
                max_price,
                min_discount,
                status = 'active',
                is_featured,
                on_sale,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = options;

            let query = `
                SELECT p.*, c.category_name, b.brand_name,
                       COALESCE(
                           (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1),
                           p.image_url
                       ) as image_url,
                       CASE 
                           WHEN p.sale_price > 0 AND p.sale_price < p.base_price 
                           THEN ROUND(((p.base_price - p.sale_price) / p.base_price) * 100, 0)
                           ELSE 0 
                       END as discount_percentage,
                       COUNT(*) OVER() as total_count
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                WHERE p.status = ?
            `;
            let params = [status];

            if (search) {
                // Split search term into words for better matching
                const searchWords = search.trim().split(/\s+/).filter(word => word.length > 0);
                
                if (searchWords.length > 0) {
                    // Build search condition for each word
                    const searchConditions = searchWords.map(() => 
                        '(p.product_name LIKE ? OR p.description LIKE ? OR b.brand_name LIKE ?)'
                    ).join(' AND ');
                    
                    query += ` AND (${searchConditions})`;
                    
                    // Add params for each word (3 params per word: name, description, brand)
                    searchWords.forEach(word => {
                        const pattern = `%${word}%`;
                        params.push(pattern, pattern, pattern);
                    });
                }
            }

            if (category_id) {
                query += ' AND p.category_id = ?';
                params.push(category_id);
            }

            if (brand_id) {
                query += ' AND p.brand_id = ?';
                params.push(brand_id);
            }

            // Handle multiple brands filter by name
            if (brands && brands.length > 0) {
                query += ` AND b.brand_name IN (${brands.map(() => '?').join(',')})`;
                params.push(...brands);
            }

            if (min_price) {
                query += ' AND p.base_price >= ?';
                params.push(min_price);
            }

            if (max_price) {
                query += ' AND p.base_price <= ?';
                params.push(max_price);
            }

            if (is_featured !== null) {
                query += ' AND p.is_featured = ?';
                params.push(is_featured);
            }

            // Filter by on_sale (products with sale_price > 0 and sale_price < base_price)
            if (on_sale === true) {
                query += ' AND p.sale_price > 0 AND p.sale_price < p.base_price';
            }

            // Filter by discount percentage
            if (min_discount !== null && min_discount !== undefined) {
                query += ` AND p.sale_price > 0 
                          AND p.sale_price < p.base_price 
                          AND ROUND(((p.base_price - p.sale_price) / p.base_price) * 100, 0) >= ?`;
                params.push(min_discount);
            }

            // Handle sorting
            const sortDirection = ['ASC', 'DESC'].includes(sort_order) ? sort_order : 'DESC';
            
            // Map sort_by values to actual column/expression
            let orderByClause = '';
            switch (sort_by) {
                case 'discount_percentage':
                    orderByClause = `CASE 
                        WHEN p.sale_price > 0 AND p.sale_price < p.base_price 
                        THEN ROUND(((p.base_price - p.sale_price) / p.base_price) * 100, 0)
                        ELSE 0 
                    END ${sortDirection}`;
                    break;
                case 'base_price':
                case 'price':
                    orderByClause = `p.base_price ${sortDirection}`;
                    break;
                case 'product_name':
                case 'name':
                    orderByClause = `p.product_name ${sortDirection}`;
                    break;
                case 'stock_quantity':
                    orderByClause = `p.stock_quantity ${sortDirection}`;
                    break;
                case 'created_at':
                default:
                    orderByClause = `p.created_at ${sortDirection}`;
            }
            
            query += ` ORDER BY ${orderByClause}`;
            query += ' LIMIT ? OFFSET ?';
            params.push(limit, (page - 1) * limit);

            const [products] = await db.execute(query, params);

            const totalCount = products.length > 0 ? products[0].total_count : 0;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                products: products.map(p => {
                    const { total_count, ...product } = p;
                    return product;
                }),
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error('Error getting all products: ' + error.message);
        }
    }

    // Create new product
    static async create(data) {
        try {
            const {
                product_name,
                description,
                short_description = null,
                sku,
                category_id,
                brand_id,
                base_price,
                price, // Hỗ trợ cả price và base_price
                sale_price = null,
                stock_quantity = 0,
                weight = null,
                dimensions = null,
                material = null,
                color = null,
                size = null,
                status = 'active',
                is_featured = false,
                meta_title = null,
                meta_description = null,
                meta_keywords = null,
                image_url = null,
                images = null,
                attributes = null,
                specifications = null
            } = data;

            // Sử dụng price nếu không có base_price
            const finalPrice = base_price || price;
            
            if (!finalPrice) {
                throw new Error('Price is required');
            }

            // Auto-generate SKU nếu không có
            const finalSku = sku || `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            // Auto-generate product_slug từ product_name
            const product_slug = product_name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-');

            // INSERT product - chỉ các cột bắt buộc
            const query = `
                INSERT INTO products (
                    product_name, product_slug, description, sku,
                    category_id, brand_id, base_price, sale_price, stock_quantity,
                    status, is_featured
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                product_name,
                product_slug,
                description,
                finalSku,
                category_id,
                brand_id,
                finalPrice,
                sale_price,
                stock_quantity,
                status,
                is_featured
            ];

            const [result] = await db.execute(query, params);

            const productId = result.insertId;

            // Nếu có image_url, thêm vào bảng product_images
            if (image_url && image_url.trim() !== '') {
                await db.execute(`
                    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
                    VALUES (?, ?, 1, 0)
                `, [productId, image_url]);
            }

            // Lấy product vừa tạo
            return await this.getById(productId);
        } catch (error) {
            throw new Error('Error creating product: ' + error.message);
        }
    }

    // Update product
    static async update(productId, data) {
        try {
            const existingProduct = await this.getById(productId);
            if (!existingProduct) {
                return null;
            }

            const {
                product_name,
                description,
                sku,
                category_id,
                brand_id,
                base_price,
                price,
                sale_price,
                stock_quantity,
                status,
                image_url,
                is_featured
            } = data;

            // Sử dụng price nếu không có base_price
            const finalPrice = base_price || price || existingProduct.base_price;

            // Generate product_slug nếu tên thay đổi
            let product_slug = existingProduct.product_slug;
            if (product_name && product_name !== existingProduct.product_name) {
                product_slug = product_name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, 'd')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-');
            }

            const query = `
                UPDATE products SET
                    product_name = ?,
                    product_slug = ?,
                    description = ?,
                    sku = ?,
                    category_id = ?,
                    brand_id = ?,
                    base_price = ?,
                    sale_price = ?,
                    stock_quantity = ?,
                    status = ?,
                    image_url = ?,
                    is_featured = ?,
                    updated_at = NOW()
                WHERE product_id = ?
            `;

            const params = [
                product_name || existingProduct.product_name,
                product_slug,
                description || existingProduct.description,
                sku || existingProduct.sku,
                category_id || existingProduct.category_id,
                brand_id || existingProduct.brand_id,
                finalPrice,
                sale_price !== undefined ? sale_price : existingProduct.sale_price,
                stock_quantity !== undefined ? stock_quantity : existingProduct.stock_quantity,
                status || existingProduct.status,
                image_url !== undefined ? image_url : existingProduct.image_url,
                is_featured !== undefined ? is_featured : existingProduct.is_featured,
                productId
            ];

            await db.execute(query, params);

            // ❌ KHÔNG CẬP NHẬT product_images ở đây nữa
            // Vì đã có hệ thống quản lý ảnh riêng qua ImageManager
            // image_url trong form update chỉ để tương thích ngược (legacy)
            
            // Chỉ thêm ảnh vào product_images nếu:
            // 1. Có image_url mới
            // 2. Chưa có ảnh nào trong product_images
            if (image_url && image_url !== existingProduct.image_url) {
                const [existingImages] = await db.execute(
                    'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
                    [productId]
                );
                
                // Chỉ thêm nếu chưa có ảnh nào (sản phẩm mới tạo)
                if (existingImages[0].count === 0) {
                    await db.execute(`
                        INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
                        VALUES (?, ?, 1, 0)
                    `, [productId, image_url]);
                }
                // Nếu đã có ảnh → KHÔNG làm gì (giữ nguyên ảnh do ImageManager quản lý)
            }

            // Lấy product đã cập nhật
            return await this.getById(productId);
        } catch (error) {
            throw new Error('Error updating product: ' + error.message);
        }
    }

    static async delete(productId) {
        try {
            // Kiểm tra sản phẩm có tồn tại không
            const product = await this.getById(productId);
            if (!product) {
                return false;
            }

            // Xóa tất cả dữ liệu liên quan (theo thứ tự để tránh foreign key constraint)
            
            // 1. Xóa product variants (phải xóa trước vì có FK với product_colors)
            await db.execute('DELETE FROM product_variants WHERE product_id = ?', [productId]);
            
            // 2. Xóa product colors (phải xóa trước product_images vì images có FK với colors)
            await db.execute('DELETE FROM product_colors WHERE product_id = ?', [productId]);
            
            // 3. Xóa product images
            await db.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
            
            // 4. Xóa cart items
            await db.execute('DELETE FROM cart_items WHERE product_id = ?', [productId]);
            await db.execute('DELETE FROM shopping_cart WHERE product_id = ?', [productId]);
            
            // 5. Xóa wishlist (skip nếu table không tồn tại)
            try {
                await db.execute('DELETE FROM wishlist WHERE product_id = ?', [productId]);
            } catch (err) {
                if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
            }
            try {
                await db.execute('DELETE FROM wishlists WHERE product_id = ?', [productId]);
            } catch (err) {
                if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
            }
            
            // 6. Xóa reviews
            await db.execute('DELETE FROM reviews WHERE product_id = ?', [productId]);
            await db.execute('DELETE FROM product_reviews WHERE product_id = ?', [productId]);
            
            // 7. Xóa product attributes và categories
            await db.execute('DELETE FROM product_attributes WHERE product_id = ?', [productId]);
            await db.execute('DELETE FROM product_categories WHERE product_id = ?', [productId]);
            
            // 8. Cuối cùng xóa product (order_items không xóa để giữ lịch sử đơn hàng)
            const [result] = await db.execute('DELETE FROM products WHERE product_id = ?', [productId]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in Product.delete:', error);
            throw new Error('Error deleting product: ' + error.message);
        }
    }

    // 🔍 Search products for suggestions (quick search)
    static async search(searchTerm, options = {}) {
        try {
            const { limit = 8, category_id = null } = options;

            // Split search term into words for better matching
            const searchWords = searchTerm.trim().split(/\s+/).filter(word => word.length > 0);

            let query = `
                SELECT p.product_id, p.product_name, p.product_slug, p.base_price, p.sale_price,
                       c.category_name, b.brand_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as image_url,
                       CASE 
                           WHEN p.sale_price > 0 AND p.sale_price < p.base_price 
                           THEN ROUND(((p.base_price - p.sale_price) / p.base_price) * 100, 0)
                           ELSE 0 
                       END as discount_percentage
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                WHERE p.status = 'active'
            `;
            let params = [];

            if (searchWords.length > 0) {
                // Build search condition for each word (must match ALL words)
                const searchConditions = searchWords.map(() => 
                    '(p.product_name LIKE ? OR p.description LIKE ? OR b.brand_name LIKE ?)'
                ).join(' AND ');
                
                query += ` AND (${searchConditions})`;
                
                // Add params for each word
                searchWords.forEach(word => {
                    const pattern = `%${word}%`;
                    params.push(pattern, pattern, pattern);
                });
            }

            if (category_id) {
                query += ' AND p.category_id = ?';
                params.push(category_id);
            }

            query += ' ORDER BY p.created_at DESC LIMIT ?';
            params.push(limit);

            const [products] = await db.execute(query, params);
            return products;
        } catch (error) {
            console.error('Error in Product.search:', error);
            throw new Error('Error searching products: ' + error.message);
        }
    }
}

module.exports = Product;
