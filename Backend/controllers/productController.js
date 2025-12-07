const Product = require('../models/Product');
const { validationResult } = require('express-validator');

const productController = {
    // Get all products with filters
    getAll: async (req, res) => {
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
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 50), // Max 50 per page
                search: search.trim(),
                category_id: category_id ? parseInt(category_id) : null,
                brand_id: brand_id ? parseInt(brand_id) : null,
                brands: brands ? brands.split(',').filter(b => b.trim()) : null,
                min_price: min_price ? parseFloat(min_price) : null,
                max_price: max_price ? parseFloat(max_price) : null,
                min_discount: min_discount ? parseFloat(min_discount) : null,
                status,
                is_featured: is_featured !== undefined ? is_featured === 'true' : null,
                on_sale: on_sale !== undefined ? on_sale === 'true' : null,
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const result = await Product.getAll(options);

            res.json({
                success: true,
                message: 'Products retrieved successfully',
                data: result.products,
                pagination: result.pagination,
                count: result.products.length
            });
        } catch (error) {
            console.error('Error in getAll products:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get product by ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID'
                });
            }

            const product = await Product.getById(id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Increment views count (async, don't wait)
            Product.incrementViews(id).catch(err => {
                console.error('Error incrementing views:', err);
            });

            res.json({
                success: true,
                message: 'Product retrieved successfully',
                data: product
            });
        } catch (error) {
            console.error('Error in getById product:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get product by slug
    getBySlug: async (req, res) => {
        try {
            const { slug } = req.params;

            if (!slug) {
                return res.status(400).json({
                    success: false,
                    message: 'Product slug is required'
                });
            }

            const product = await Product.getBySlug(slug);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                message: 'Product retrieved successfully',
                data: product
            });
        } catch (error) {
            console.error('Error in getBySlug product:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get products by category slug
    getByCategory: async (req, res) => {
        try {
            const { categorySlug } = req.params;
            const {
                page = 1,
                limit = 20,
                min_price,
                max_price,
                brand_id,
                brands,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = req.query;

            if (!categorySlug) {
                return res.status(400).json({
                    success: false,
                    message: 'Category slug is required'
                });
            }

            const options = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 50),
                category_slug: categorySlug,
                min_price: min_price ? parseFloat(min_price) : null,
                max_price: max_price ? parseFloat(max_price) : null,
                brand_id: brand_id ? parseInt(brand_id) : null,
                brands: brands ? brands.split(',').filter(b => b.trim()) : null,
                status: 'active',
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const result = await Product.getByCategorySlug(options);

            res.json({
                success: true,
                message: 'Products retrieved successfully',
                data: result.products,
                pagination: result.pagination,
                count: result.products.length
            });
        } catch (error) {
            console.error('Error getting products by category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get products',
                error: error.message
            });
        }
    },

    // 🎾 Get badminton rackets
    getBadmintonRackets: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                min_price,
                max_price,
                brand_id,
                brands,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 50),
                category_name: 'Vợt cầu lông',
                min_price: min_price ? parseFloat(min_price) : null,
                max_price: max_price ? parseFloat(max_price) : null,
                brand_id: brand_id ? parseInt(brand_id) : null,
                brands: brands ? brands.split(',').filter(b => b.trim()) : null,
                status: 'active',
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const result = await Product.getByCategory(options);

            res.json({
                success: true,
                message: 'Badminton rackets retrieved successfully',
                data: result.products,
                pagination: result.pagination,
                count: result.products.length
            });
        } catch (error) {
            console.error('Error getting badminton rackets:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get badminton rackets',
                error: error.message
            });
        }
    },

    // 🏸 Get shuttlecocks
    getShuttlecocks: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                min_price,
                max_price,
                brand_id,
                brands,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 50),
                category_name: 'Cầu lông',
                min_price: min_price ? parseFloat(min_price) : null,
                max_price: max_price ? parseFloat(max_price) : null,
                brand_id: brand_id ? parseInt(brand_id) : null,
                status: 'active',
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const result = await Product.getByCategory(options);

            res.json({
                success: true,
                message: 'Shuttlecocks retrieved successfully',
                data: result.products,
                pagination: result.pagination,
                count: result.products.length
            });
        } catch (error) {
            console.error('Error getting shuttlecocks:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get shuttlecocks',
                error: error.message
            });
        }
    },

    // 👟 Get badminton shoes
    getBadmintonShoes: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                min_price,
                max_price,
                brand_id,
                brands,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 50),
                category_name: 'Giày cầu lông',
                min_price: min_price ? parseFloat(min_price) : null,
                max_price: max_price ? parseFloat(max_price) : null,
                brand_id: brand_id ? parseInt(brand_id) : null,
                brands: brands ? brands.split(',').filter(b => b.trim()) : null,
                status: 'active',
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const result = await Product.getByCategory(options);

            res.json({
                success: true,
                message: 'Badminton shoes retrieved successfully',
                data: result.products,
                pagination: result.pagination,
                count: result.products.length
            });
        } catch (error) {
            console.error('Error getting badminton shoes:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get badminton shoes',
                error: error.message
            });
        }
    },

    // 🎒 Get badminton accessories
    getBadmintonAccessories: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                min_price,
                max_price,
                brand_id,
                brands,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 50),
                category_name: 'Phụ kiện cầu lông',
                min_price: min_price ? parseFloat(min_price) : null,
                max_price: max_price ? parseFloat(max_price) : null,
                brand_id: brand_id ? parseInt(brand_id) : null,
                brands: brands ? brands.split(',').filter(b => b.trim()) : null,
                status: 'active',
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const result = await Product.getByCategory(options);

            res.json({
                success: true,
                message: 'Badminton accessories retrieved successfully',
                data: result.products,
                pagination: result.pagination,
                count: result.products.length
            });
        } catch (error) {
            console.error('Error getting badminton accessories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get badminton accessories',
                error: error.message
            });
        }
    },

    // Get featured products
    getFeatured: async (req, res) => {
        try {
            const { limit = 10 } = req.query;
            const products = await Product.getFeatured(Math.min(parseInt(limit), 20));

            res.json({
                success: true,
                message: 'Featured products retrieved successfully',
                data: products,
                count: products.length
            });
        } catch (error) {
            console.error('Error in getFeatured products:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Search products
    search: async (req, res) => {
        try {
            const { q: searchTerm, category_id, limit = 20 } = req.query;

            if (!searchTerm || searchTerm.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Search term must be at least 2 characters'
                });
            }

            const options = {
                limit: Math.min(parseInt(limit), 50),
                category_id: category_id ? parseInt(category_id) : null
            };

            const products = await Product.search(searchTerm.trim(), options);

            res.json({
                success: true,
                message: 'Products search completed',
                data: products,
                count: products.length,
                search_term: searchTerm.trim()
            });
        } catch (error) {
            console.error('Error in search products:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // 📦 Get low stock products for admin
    getLowStockProducts: async (req, res) => {
        try {
            const { threshold = 10 } = req.query;
            const products = await Product.getLowStock(parseInt(threshold));

            res.json({
                success: true,
                message: 'Low stock products retrieved successfully',
                data: products,
                count: products.length
            });
        } catch (error) {
            console.error('Error getting low stock products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get low stock products',
                error: error.message
            });
        }
    },

    // 📊 Update product stock
    updateStock: async (req, res) => {
        try {
            const { id } = req.params;
            const { stock_quantity, operation = 'set' } = req.body;

            if (stock_quantity < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock quantity cannot be negative'
                });
            }

            const product = await Product.getById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            let newQuantity = stock_quantity;
            if (operation === 'add') {
                newQuantity = product.stock_quantity + stock_quantity;
            } else if (operation === 'subtract') {
                newQuantity = Math.max(0, product.stock_quantity - stock_quantity);
            }

            const success = await Product.updateStock(id, newQuantity);

            if (success) {
                res.json({
                    success: true,
                    message: 'Stock updated successfully',
                    data: {
                        product_id: id,
                        old_quantity: product.stock_quantity,
                        new_quantity: newQuantity,
                        operation
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to update stock'
                });
            }
        } catch (error) {
            console.error('Error updating stock:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update stock',
                error: error.message
            });
        }
    },

    // 📈 Get product statistics
    getProductStats: async (req, res) => {
        try {
            const stats = await Product.getStats();

            res.json({
                success: true,
                message: 'Product statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Error getting product stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get product statistics',
                error: error.message
            });
        }
    },

    // Create product (Admin only)
    create: async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
                console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const product = await Product.create(req.body);

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: product
            });
        } catch (error) {
            console.error('Error in create product:', error);
            
            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Update product (Admin only)
    update: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID'
                });
            }

            // 🔍 LOG REQUEST BODY FOR DEBUGGING
            console.log('📦 UPDATE PRODUCT', id);
            console.log('📝 Request body:', JSON.stringify(req.body, null, 2));

            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const product = await Product.update(id, req.body);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                message: 'Product updated successfully',
                data: product
            });
        } catch (error) {
            console.error('Error in update product:', error);
            
            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Delete product (Admin only)
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID'
                });
            }

            const deleted = await Product.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            console.error('Error in delete product:', error);
            
            if (error.message.includes('been ordered')) {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Get low stock products (Admin only)
    getLowStock: async (req, res) => {
        try {
            const { min_level = 5 } = req.query;
            const products = await Product.getLowStock(parseInt(min_level));

            res.json({
                success: true,
                message: 'Low stock products retrieved successfully',
                data: products,
                count: products.length
            });
        } catch (error) {
            console.error('Error in getLowStock products:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = productController;