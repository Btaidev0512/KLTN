const ProductAttribute = require('../models/ProductAttribute');

const productAttributeController = {
    // Get attributes definition for a category
    getAttributesByCategory: async (req, res) => {
        try {
            const { categoryId } = req.params;
            const { brandId } = req.query; // Get brandId from query params
            
            const attributes = await ProductAttribute.getAttributesByCategory(categoryId, brandId);
            
            res.status(200).json({
                success: true,
                message: 'Attributes retrieved successfully',
                data: attributes
            });
        } catch (error) {
            console.error('Error in getAttributesByCategory:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch attributes',
                error: error.message
            });
        }
    },

    // Get product's attribute values
    getProductAttributes: async (req, res) => {
        try {
            const { productId } = req.params;
            
            const attributes = await ProductAttribute.getProductAttributes(productId);
            
            res.status(200).json({
                success: true,
                message: 'Product attributes retrieved successfully',
                data: attributes
            });
        } catch (error) {
            console.error('Error in getProductAttributes:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product attributes',
                error: error.message
            });
        }
    },

    // Set/Update product attributes
    setProductAttributes: async (req, res) => {
        try {
            const { productId } = req.params;
            const { attributes } = req.body;
            
            console.log('📝 Setting attributes for product:', productId);
            console.log('📦 Attributes payload:', JSON.stringify(attributes, null, 2));
            
            if (!Array.isArray(attributes)) {
                console.error('❌ Attributes is not an array:', typeof attributes);
                return res.status(400).json({
                    success: false,
                    message: 'attributes must be an array'
                });
            }
            
            // Validate each attribute has required fields
            for (const attr of attributes) {
                if (!attr.attribute_id) {
                    console.error('❌ Missing attribute_id:', attr);
                    return res.status(400).json({
                        success: false,
                        message: 'Each attribute must have attribute_id'
                    });
                }
                if (!attr.value_id && !attr.custom_value) {
                    console.error('❌ Missing value_id or custom_value:', attr);
                    return res.status(400).json({
                        success: false,
                        message: 'Each attribute must have value_id or custom_value'
                    });
                }
            }
            
            console.log('✅ Validation passed, saving to database...');
            await ProductAttribute.setProductAttributes(productId, attributes);
            console.log('✅ Attributes saved successfully');
            
            res.status(200).json({
                success: true,
                message: 'Product attributes updated successfully'
            });
        } catch (error) {
            console.error('❌ Error in setProductAttributes:', error);
            console.error('Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Failed to update product attributes',
                error: error.message
            });
        }
    },

    // Get filter options with counts for a category
    getFilterOptions: async (req, res) => {
        try {
            const { categoryId } = req.params;
            const brandIdRaw = req.query.brandId; // Get brandId from query params for brand-specific filters
            const brandId = brandIdRaw ? parseInt(brandIdRaw) : null; // Parse to integer
            
            console.log('🔍 getFilterOptions called:', { categoryId, brandIdRaw, brandId, type: typeof brandId });
            
            const options = await ProductAttribute.getFilterOptions(categoryId, brandId);
            
            console.log('📦 Returning', options.length, 'attributes');
            const racketSeries = options.find(o => o.attribute_key === 'racket_series');
            if (racketSeries) {
                console.log('🎾 Racket series count:', racketSeries.values?.length || 0);
            }
            
            res.status(200).json({
                success: true,
                message: 'Filter options retrieved successfully',
                data: options
            });
        } catch (error) {
            console.error('Error in getFilterOptions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch filter options',
                error: error.message
            });
        }
    },

    // Filter products by attributes
    filterProducts: async (req, res) => {
        try {
            const { categoryId } = req.params;
            const filters = req.query; // e.g., ?shaft_flex=stiff,medium&weight=3u,4u
            
            // Parse filters
            const parsedFilters = {};
            for (const [key, value] of Object.entries(filters)) {
                if (key !== 'page' && key !== 'limit') {
                    parsedFilters[key] = value.split(',');
                }
            }
            
            const products = await ProductAttribute.filterProducts(categoryId, parsedFilters);
            
            console.log('🖼️ Filter result - First product:', JSON.stringify(products[0], null, 2));
            
            res.status(200).json({
                success: true,
                message: 'Products filtered successfully',
                count: products.length,
                data: products
            });
        } catch (error) {
            console.error('Error in filterProducts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to filter products',
                error: error.message
            });
        }
    }
};

module.exports = productAttributeController;
