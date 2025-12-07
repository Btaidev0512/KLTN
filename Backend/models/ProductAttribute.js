const db = require('../config/database');

class ProductAttribute {
    // Get all attribute definitions for a category
    static async getAttributesByCategory(categoryId, brandId = null) {
        try {
            const query = `
                SELECT 
                    ad.attribute_id,
                    ad.attribute_name,
                    ad.attribute_key,
                    ad.attribute_type,
                    ad.is_filterable,
                    ad.is_required,
                    ad.display_order
                FROM attribute_definitions ad
                WHERE ad.category_id = ?
                ORDER BY ad.display_order ASC
            `;
            
            const [attributes] = await db.execute(query, [categoryId]);
            
            // Get values for each attribute
            for (let attr of attributes) {
                // Convert is_required from tinyint to boolean
                attr.is_required = Boolean(attr.is_required);
                attr.is_filterable = Boolean(attr.is_filterable);
                
                let valuesQuery = `
                    SELECT value_id, value_name, value_key, brand_id, display_order
                    FROM attribute_values
                    WHERE attribute_id = ?`;
                
                const params = [attr.attribute_id];
                
                // Filter by brand_id if provided (for "Dòng vợt" attribute)
                if (brandId && attr.attribute_key === 'racket_series') {
                    valuesQuery += ` AND (brand_id = ? OR brand_id IS NULL)`;
                    params.push(brandId);
                }
                
                valuesQuery += ` ORDER BY display_order ASC`;
                
                const [values] = await db.execute(valuesQuery, params);
                attr.values = values;
            }
            
            return attributes;
        } catch (error) {
            console.error('Get attributes by category error:', error);
            throw error;
        }
    }

    // Get product attributes with values
    static async getProductAttributes(productId) {
        try {
            const query = `
                SELECT 
                    pa.product_attribute_id,
                    pa.product_id,
                    ad.attribute_id,
                    ad.attribute_name,
                    ad.attribute_key,
                    ad.attribute_type,
                    av.value_id,
                    av.value_name,
                    av.value_key,
                    pa.custom_value
                FROM product_attributes pa
                JOIN attribute_definitions ad ON pa.attribute_id = ad.attribute_id
                LEFT JOIN attribute_values av ON pa.value_id = av.value_id
                WHERE pa.product_id = ?
                ORDER BY ad.display_order ASC
            `;
            
            const [attributes] = await db.execute(query, [productId]);
            return attributes;
        } catch (error) {
            console.error('Get product attributes error:', error);
            throw error;
        }
    }

    // Set product attributes (create or update)
    static async setProductAttributes(productId, attributes) {
        try {
            const connection = await db.pool.getConnection();
            
            try {
                await connection.beginTransaction();
                
                // Delete existing attributes for this product
                await connection.execute(
                    'DELETE FROM product_attributes WHERE product_id = ?',
                    [productId]
                );
                
                // Insert new attributes
                for (const attr of attributes) {
                    const { attribute_id, value_id, custom_value } = attr;
                    
                    await connection.execute(
                        `INSERT INTO product_attributes (product_id, attribute_id, value_id, custom_value)
                         VALUES (?, ?, ?, ?)`,
                        [productId, attribute_id, value_id || null, custom_value || null]
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
            console.error('Set product attributes error:', error);
            throw error;
        }
    }

    // Filter products by attributes
    static async filterProducts(categoryId, filters = {}) {
        try {
            let joins = '';
            let whereConditions = [];
            let params = [categoryId];
            let joinIndex = 0;
            
            // Add joins and conditions for each filter
            for (const [attributeKey, values] of Object.entries(filters)) {
                if (!values || values.length === 0) continue;
                
                joinIndex++;
                const joinAlias = `pa${joinIndex}`;
                const valueAlias = `av${joinIndex}`;
                
                joins += `
                    INNER JOIN product_attributes ${joinAlias} ON p.product_id = ${joinAlias}.product_id
                    INNER JOIN attribute_definitions ad${joinIndex} ON ${joinAlias}.attribute_id = ad${joinIndex}.attribute_id
                    LEFT JOIN attribute_values ${valueAlias} ON ${joinAlias}.value_id = ${valueAlias}.value_id
                `;
                
                whereConditions.push(`ad${joinIndex}.attribute_key = ?`);
                params.push(attributeKey);
                
                // Handle multiple values (OR condition)
                const placeholders = values.map(() => '?').join(',');
                whereConditions.push(`${valueAlias}.value_key IN (${placeholders})`);
                params.push(...values);
            }
            
            // Build final query with proper SQL order: FROM -> JOIN -> WHERE
            // Include brand, category AND product image
            let query = `
                SELECT DISTINCT 
                    p.product_id,
                    p.product_name,
                    p.product_slug,
                    p.description,
                    p.short_description,
                    p.category_id,
                    p.brand_id,
                    p.base_price,
                    p.sale_price,
                    p.stock_quantity,
                    pi.image_url,
                    p.sku,
                    p.status,
                    p.is_featured,
                    p.view_count,
                    p.purchase_count,
                    p.rating_average,
                    p.rating_count,
                    p.created_at,
                    p.updated_at,
                    b.brand_name,
                    c.category_name,
                    c.category_slug
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                LEFT JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN (
                    SELECT product_id, image_url 
                    FROM product_images 
                    WHERE is_primary = 1
                ) pi ON p.product_id = pi.product_id
                ${joins}
                WHERE p.category_id = ?
                AND p.status = 'active'
            `;
            
            // Add filter conditions
            if (whereConditions.length > 0) {
                query += ` AND ${whereConditions.join(' AND ')}`;
            }
            
            query += ` ORDER BY p.created_at DESC`;
            
            console.log('🔍 Filter query:', query);
            console.log('🔍 Filter params:', params);
            
            const [products] = await db.execute(query, params);
            return products;
        } catch (error) {
            console.error('Filter products error:', error);
            throw error;
        }
    }

    // Get filter options with counts for a category
    static async getFilterOptions(categoryId, brandId = null) {
        try {
            console.log('🔍 getFilterOptions MODEL:', { categoryId, brandId, categoryIdType: typeof categoryId, brandIdType: typeof brandId });
            
            let query = `
                SELECT 
                    ad.attribute_id,
                    ad.attribute_name,
                    ad.attribute_key,
                    av.value_id,
                    av.value_name,
                    av.value_key,
                    av.brand_id,
                    COUNT(DISTINCT pa.product_id) as product_count
                FROM attribute_definitions ad
                LEFT JOIN attribute_values av ON ad.attribute_id = av.attribute_id
                LEFT JOIN product_attributes pa ON av.value_id = pa.value_id
                LEFT JOIN products p ON pa.product_id = p.product_id AND p.status = 'active'
                WHERE ad.category_id = ? AND ad.is_filterable = 1`;
            
            const params = [categoryId];
            
            // Filter racket_series by brand if provided
            if (brandId && categoryId == 1) { // Vợt cầu lông
                console.log('✅ Adding brand filter for racket_series');
                query += ` AND (ad.attribute_key != 'racket_series' OR av.brand_id = ? OR av.brand_id IS NULL)`;
                params.push(brandId);
            } else {
                console.log('⏭️ No brand filter:', { brandId, categoryId, condition: categoryId == 1 });
            }
            
            query += `
                GROUP BY ad.attribute_id, ad.attribute_name, ad.attribute_key, 
                         av.value_id, av.value_name, av.value_key, av.brand_id
                ORDER BY ad.display_order ASC, av.display_order ASC
            `;
            
            console.log('📝 Query params:', params);
            
            const [rows] = await db.execute(query, params);
            
            // Group by attribute
            const grouped = {};
            for (const row of rows) {
                if (!grouped[row.attribute_key]) {
                    grouped[row.attribute_key] = {
                        attribute_id: row.attribute_id,
                        attribute_name: row.attribute_name,
                        attribute_key: row.attribute_key,
                        values: []
                    };
                }
                
                if (row.value_id) {
                    grouped[row.attribute_key].values.push({
                        value_id: row.value_id,
                        value_name: row.value_name,
                        value_key: row.value_key,
                        product_count: row.product_count
                    });
                }
            }
            
            // If no brandId provided for Vợt category, remove racket_series filter
            if (!brandId && categoryId == 1) {
                delete grouped['racket_series'];
            }
            
            return Object.values(grouped);
        } catch (error) {
            console.error('Get filter options error:', error);
            throw error;
        }
    }

    // Set/Update product attributes - SIMPLIFIED VERSION
    static async setProductAttributes(productId, attributes) {
        try {
            console.log('🗑️ Deleting old attributes for product:', productId);
            
            // Delete existing attributes using pool directly (no manual connection)
            const [deleteResult] = await db.execute(
                'DELETE FROM product_attributes WHERE product_id = ?',
                [productId]
            );
            console.log('✅ Deleted', deleteResult.affectedRows, 'old attributes');
            
            // Insert new attributes one by one
            if (attributes && attributes.length > 0) {
                console.log('💾 Inserting', attributes.length, 'new attributes');
                
                for (let i = 0; i < attributes.length; i++) {
                    const attr = attributes[i];
                    console.log(`  [${i+1}/${attributes.length}] Inserting attribute_id=${attr.attribute_id}, value_id=${attr.value_id}`);
                    
                    await db.execute(
                        'INSERT INTO product_attributes (product_id, attribute_id, value_id, custom_value) VALUES (?, ?, ?, ?)',
                        [productId, attr.attribute_id, attr.value_id || null, attr.custom_value || null]
                    );
                }
                console.log('✅ All attributes inserted successfully');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error in setProductAttributes:', error.message);
            console.error('Error code:', error.code);
            console.error('SQL State:', error.sqlState);
            throw error;
        }
    }
}

module.exports = ProductAttribute;
