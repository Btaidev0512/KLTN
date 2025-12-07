// 🔍 ENHANCED SEARCH MODEL - PHASE 1
const db = require('../config/database');

class EnhancedSearch {
    // 🔤 Enhanced Full-Text Search với faceted filters
    static async searchProducts(searchParams = {}) {
        try {
            const {
                query = '',
                category_id = null,
                brand_id = null,
                min_price = null,
                max_price = null,
                min_rating = null,
                sort_by = 'relevance',
                page = 1,
                limit = 20,
                in_stock_only = false
            } = searchParams;

            let sql = `
                SELECT DISTINCT p.*, 
                       c.category_name,
                       b.brand_name,
                       COALESCE(AVG(r.rating), 0) as avg_rating,
                       COUNT(r.review_id) as review_count,
                       COALESCE(p.base_price, p.sale_price, 0) as price
            `;

            // Full-text search scoring
            if (query) {
                sql += `, MATCH(p.product_name, p.description, COALESCE(p.tags, '')) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance_score `;
            }

            sql += `
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                LEFT JOIN reviews r ON p.product_id = r.product_id
                WHERE 1=1
            `;

            const params = [];

            // Full-text search condition
            if (query) {
                sql += ` AND MATCH(p.product_name, p.description, COALESCE(p.tags, '')) AGAINST(? IN NATURAL LANGUAGE MODE) `;
                params.push(query);
            }

            // Faceted filters
            if (category_id) {
                sql += ` AND p.category_id = ? `;
                params.push(category_id);
            }

            if (brand_id) {
                sql += ` AND p.brand_id = ? `;
                params.push(brand_id);
            }

            if (min_price !== null) {
                sql += ` AND COALESCE(p.sale_price, p.base_price) >= ? `;
                params.push(min_price);
            }

            if (max_price !== null) {
                sql += ` AND COALESCE(p.sale_price, p.base_price) <= ? `;
                params.push(max_price);
            }

            if (in_stock_only) {
                sql += ` AND p.status = 'active' `;
            }

            sql += ` GROUP BY p.product_id `;

            // Rating filter (after aggregation)
            if (min_rating !== null) {
                sql += ` HAVING avg_rating >= ? `;
                params.push(min_rating);
            }

            // Sorting
            switch (sort_by) {
                case 'relevance':
                    if (query) {
                        sql += ` ORDER BY relevance_score DESC, avg_rating DESC `;
                    } else {
                        sql += ` ORDER BY avg_rating DESC, review_count DESC `;
                    }
                    break;
                case 'price_asc':
                    sql += ` ORDER BY COALESCE(p.sale_price, p.base_price) ASC `;
                    break;
                case 'price_desc':
                    sql += ` ORDER BY COALESCE(p.sale_price, p.base_price) DESC `;
                    break;
                case 'rating':
                    sql += ` ORDER BY avg_rating DESC, review_count DESC `;
                    break;
                case 'newest':
                    sql += ` ORDER BY p.created_at DESC `;
                    break;
                case 'popularity':
                    sql += ` ORDER BY review_count DESC, avg_rating DESC `;
                    break;
                default:
                    sql += ` ORDER BY p.created_at DESC `;
            }

            // Pagination
            const offset = (page - 1) * limit;
            sql += ` LIMIT ? OFFSET ? `;
            params.push(limit, offset);

            const [products] = await db.execute(sql, params);

            // Get total count for pagination
            const totalCount = await this.getSearchResultCount(searchParams);

            return {
                products,
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total: totalCount,
                    total_pages: Math.ceil(totalCount / limit)
                }
            };

        } catch (error) {
            console.error('Enhanced search error:', error);
            throw error;
        }
    }

    // 📊 Get search result count for pagination
    static async getSearchResultCount(searchParams) {
        try {
            const {
                query = '',
                category_id = null,
                brand_id = null,
                min_price = null,
                max_price = null,
                min_rating = null,
                in_stock_only = false
            } = searchParams;

            let sql = `
                SELECT COUNT(DISTINCT p.product_id) as total
                FROM products p
                LEFT JOIN reviews r ON p.product_id = r.product_id
                WHERE 1=1
            `;

            const params = [];

            if (query) {
                sql += ` AND MATCH(p.product_name, p.description, COALESCE(p.tags, '')) AGAINST(? IN NATURAL LANGUAGE MODE) `;
                params.push(query);
            }

            if (category_id) {
                sql += ` AND p.category_id = ? `;
                params.push(category_id);
            }

            if (brand_id) {
                sql += ` AND p.brand_id = ? `;
                params.push(brand_id);
            }

            if (min_price !== null) {
                sql += ` AND COALESCE(p.sale_price, p.base_price) >= ? `;
                params.push(min_price);
            }

            if (max_price !== null) {
                sql += ` AND COALESCE(p.sale_price, p.base_price) <= ? `;
                params.push(max_price);
            }

            if (in_stock_only) {
                sql += ` AND p.status = 'active' `;
            }

            if (min_rating !== null) {
                sql = `
                    SELECT COUNT(*) as total FROM (
                        SELECT p.product_id
                        FROM products p
                        LEFT JOIN reviews r ON p.product_id = r.product_id
                        WHERE 1=1
                `;

                if (query) {
                    sql += ` AND MATCH(p.product_name, p.description, COALESCE(p.tags, '')) AGAINST(? IN NATURAL LANGUAGE MODE) `;
                }
                if (category_id) sql += ` AND p.category_id = ? `;
                if (brand_id) sql += ` AND p.brand_id = ? `;
                if (min_price !== null) sql += ` AND COALESCE(p.sale_price, p.base_price) >= ? `;
                if (max_price !== null) sql += ` AND COALESCE(p.sale_price, p.base_price) <= ? `;
                if (in_stock_only) sql += ` AND p.status = 'active' `;

                sql += ` GROUP BY p.product_id HAVING AVG(r.rating) >= ? ) as filtered_products `;
                params.push(min_rating);
            }

            const [result] = await db.execute(sql, params);
            return result[0].total;

        } catch (error) {
            console.error('Search count error:', error);
            throw error;
        }
    }

    // 🎛️ Get available filters for faceted search
    static async getAvailableFilters(query = '') {
        try {
            let baseWhere = '';
            const params = [];

            if (query) {
                baseWhere = ` WHERE MATCH(p.product_name, p.description, COALESCE(p.tags, '')) AGAINST(? IN NATURAL LANGUAGE MODE) `;
                params.push(query);
            }

            // Get available categories
            const categorySql = `
                SELECT c.category_id, c.category_name as name, COUNT(DISTINCT p.product_id) as product_count
                FROM categories c
                INNER JOIN products p ON c.category_id = p.category_id
                ${baseWhere}
                GROUP BY c.category_id, c.category_name
                HAVING product_count > 0
                ORDER BY product_count DESC, c.category_name ASC
            `;

            // Get available brands  
            const brandSql = `
                SELECT b.brand_id, b.brand_name as name, COUNT(DISTINCT p.product_id) as product_count
                FROM brands b
                INNER JOIN products p ON b.brand_id = p.brand_id
                ${baseWhere}
                GROUP BY b.brand_id, b.brand_name
                HAVING product_count > 0
                ORDER BY product_count DESC, b.brand_name ASC
            `;

            // Get price range
            const priceSql = `
                SELECT 
                    MIN(COALESCE(p.sale_price, p.base_price)) as min_price,
                    MAX(COALESCE(p.sale_price, p.base_price)) as max_price,
                    AVG(COALESCE(p.sale_price, p.base_price)) as avg_price
                FROM products p
                ${baseWhere}
            `;

            // Get rating distribution
            const ratingSql = `
                SELECT 
                    FLOOR(AVG(r.rating)) as rating_level,
                    COUNT(DISTINCT p.product_id) as product_count
                FROM products p
                LEFT JOIN reviews r ON p.product_id = r.product_id
                ${baseWhere}
                GROUP BY FLOOR(AVG(r.rating))
                HAVING rating_level >= 1
                ORDER BY rating_level DESC
            `;

            const [categories] = await db.execute(categorySql, params);
            const [brands] = await db.execute(brandSql, params);
            const [priceRange] = await db.execute(priceSql, params);
            const [ratings] = await db.execute(ratingSql, params);

            return {
                categories,
                brands,
                price_range: priceRange[0] || { min_price: 0, max_price: 0, avg_price: 0 },
                ratings
            };

        } catch (error) {
            console.error('Get filters error:', error);
            throw error;
        }
    }

    // ⚡ Get search suggestions for auto-complete
    static async getSearchSuggestions(query, limit = 10) {
        try {
            if (!query || query.length < 2) {
                return [];
            }

            const sql = `
                (
                    SELECT DISTINCT product_name as suggestion, 'product' as type, 'product' as category
                    FROM products
                    WHERE product_name LIKE ?
                    ORDER BY product_name ASC
                    LIMIT ?
                )
                UNION
                (
                    SELECT DISTINCT brand_name as suggestion, 'brand' as type, 'brand' as category
                    FROM brands
                    WHERE brand_name LIKE ?
                    ORDER BY brand_name ASC
                    LIMIT ?
                )
                UNION
                (
                    SELECT DISTINCT category_name as suggestion, 'category' as type, 'category' as category
                    FROM categories
                    WHERE category_name LIKE ?
                    ORDER BY category_name ASC
                    LIMIT ?
                )
                ORDER BY suggestion ASC
                LIMIT ?
            `;

            const searchPattern = `%${query}%`;
            const [suggestions] = await db.execute(sql, [
                searchPattern, Math.ceil(limit/3),
                searchPattern, Math.ceil(limit/3), 
                searchPattern, Math.ceil(limit/3),
                limit
            ]);

            return suggestions;

        } catch (error) {
            console.error('Search suggestions error:', error);
            throw error;
        }
    }

    // 📊 Track search query for analytics
    static async trackSearchQuery(query, userId = null, resultCount = 0) {
        try {
            const sql = `
                INSERT INTO search_analytics (query, user_id, result_count, searched_at)
                VALUES (?, ?, ?, NOW())
            `;

            await db.execute(sql, [query, userId, resultCount]);
            return true;

        } catch (error) {
            console.error('Track search error:', error);
            // Don't throw error for analytics tracking
            return false;
        }
    }

    // 📈 Get popular searches
    static async getPopularSearches(limit = 10) {
        try {
            const sql = `
                SELECT query, COUNT(*) as search_count
                FROM search_analytics
                WHERE searched_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                AND result_count > 0
                GROUP BY query
                ORDER BY search_count DESC
                LIMIT ?
            `;

            const [popular] = await db.execute(sql, [limit]);
            return popular;

        } catch (error) {
            console.error('Popular searches error:', error);
            throw error;
        }
    }
}

module.exports = EnhancedSearch;