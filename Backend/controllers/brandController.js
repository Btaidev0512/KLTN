const Brand = require('../models/Brand');

const brandController = {
    // Get all brands với pagination và filters
    getAllBrands: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                search = '',
                is_active,
                country
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100), // Max 100 per page
                search: search.trim(),
                is_active: is_active !== undefined ? is_active === 'true' : null,
                country: country || null
            };

            const result = await Brand.findAll(options);

            res.status(200).json({
                success: true,
                message: 'Brands retrieved successfully',
                data: result.brands,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error in getAllBrands:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brands',
                error: error.message
            });
        }
    },

    // Get brand by ID
    getBrandById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid brand ID'
                });
            }

            const brand = await Brand.findById(parseInt(id));

            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Brand retrieved successfully',
                data: brand
            });
        } catch (error) {
            console.error('Error in getBrandById:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brand',
                error: error.message
            });
        }
    },

    // Get brand by slug
    getBrandBySlug: async (req, res) => {
        try {
            const { slug } = req.params;

            if (!slug) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand slug is required'
                });
            }

            const brand = await Brand.findBySlug(slug);

            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Brand retrieved successfully',
                data: brand
            });
        } catch (error) {
            console.error('Error in getBrandBySlug:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brand',
                error: error.message
            });
        }
    },

    // Get popular brands
    getPopularBrands: async (req, res) => {
        try {
            const { limit = 10 } = req.query;
            
            const brands = await Brand.getPopular(parseInt(limit));

            res.status(200).json({
                success: true,
                message: 'Popular brands retrieved successfully',
                data: brands,
                count: brands.length
            });
        } catch (error) {
            console.error('Error in getPopularBrands:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch popular brands',
                error: error.message
            });
        }
    },

    // Get brands by country
    getBrandsByCountry: async (req, res) => {
        try {
            const { country } = req.params;
            const { limit = 20 } = req.query;

            if (!country) {
                return res.status(400).json({
                    success: false,
                    message: 'Country is required'
                });
            }

            const brands = await Brand.getByCountry(country, parseInt(limit));

            res.status(200).json({
                success: true,
                message: `Brands from ${country} retrieved successfully`,
                data: brands,
                count: brands.length
            });
        } catch (error) {
            console.error('Error in getBrandsByCountry:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brands by country',
                error: error.message
            });
        }
    },

    // Search brands
    searchBrands: async (req, res) => {
        try {
            const { q: searchTerm, limit = 20 } = req.query;

            if (!searchTerm) {
                return res.status(400).json({
                    success: false,
                    message: 'Search term is required'
                });
            }

            const brands = await Brand.search(searchTerm, parseInt(limit));

            res.status(200).json({
                success: true,
                message: 'Brand search completed successfully',
                data: brands,
                count: brands.length,
                searchTerm
            });
        } catch (error) {
            console.error('Error in searchBrands:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search brands',
                error: error.message
            });
        }
    },

    // Get all countries with brands
    getBrandCountries: async (req, res) => {
        try {
            const countries = await Brand.getCountries();

            res.status(200).json({
                success: true,
                message: 'Brand countries retrieved successfully',
                data: countries,
                count: countries.length
            });
        } catch (error) {
            console.error('Error in getBrandCountries:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brand countries',
                error: error.message
            });
        }
    },

    // Create new brand (Admin only)
    createBrand: async (req, res) => {
        try {
            const { category_ids, ...brandData } = req.body; // Extract category_ids separately
            
            const data = {
                name: req.body.brand_name || req.body.name,
                description: req.body.description,
                logo_url: req.body.logo_url,
                website_url: req.body.website_url,
                country: req.body.country,
                established_year: req.body.established_year,
                sort_order: req.body.sort_order || 0,
                meta_title: req.body.meta_title,
                meta_description: req.body.meta_description,
                category_id: req.body.category_id // Keep for backward compatibility
            };

            // Validate required fields
            if (!data.name || data.name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Brand name is required'
                });
            }

            const brandId = await Brand.create(data, category_ids);

            // Get created brand with categories
            const newBrand = await Brand.findById(brandId);

            res.status(201).json({
                success: true,
                message: 'Brand created successfully',
                data: newBrand
            });
        } catch (error) {
            console.error('Error in createBrand:', error);
            
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'Brand name or slug already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to create brand',
                error: error.message
            });
        }
    },

    // Update brand (Admin only)
    updateBrand: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid brand ID'
                });
            }

            // Check validation errors
            // const errors = validationResult(req);
            // if (!errors.isEmpty()) {
            //     return res.status(400).json({
            //         success: false,
            //         message: 'Validation failed',
            //         errors: errors.array()
            //     });
            // }

            const { category_ids, ...otherData } = req.body; // Extract category_ids
            
            const updateData = {
                name: req.body.brand_name || req.body.name,
                description: req.body.description,
                logo_url: req.body.logo_url,
                website_url: req.body.website_url,
                country: req.body.country,
                established_year: req.body.established_year,
                is_active: req.body.is_active,
                sort_order: req.body.sort_order,
                meta_title: req.body.meta_title,
                meta_description: req.body.meta_description,
                category_id: req.body.category_id // Keep for backward compatibility
            };

            const updated = await Brand.update(parseInt(id), updateData, category_ids);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            // Get updated brand with categories
            const updatedBrand = await Brand.findById(parseInt(id));

            res.status(200).json({
                success: true,
                message: 'Brand updated successfully',
                data: updatedBrand
            });
        } catch (error) {
            console.error('Error in updateBrand:', error);
            
            if (error.code === 'ER_DUP_ENTRY') {
                // Check if the duplicate is from the same brand (updating itself)
                const message = error.sqlMessage || '';
                return res.status(400).json({
                    success: false,
                    message: 'Tên thương hiệu hoặc slug đã tồn tại ở thương hiệu khác'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to update brand',
                error: error.message
            });
        }
    },    // Delete brand (Admin only) - soft delete
    deleteBrand: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid brand ID'
                });
            }

            const deleted = await Brand.delete(parseInt(id));

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Brand deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteBrand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete brand',
                error: error.message
            });
        }
    },

    // Reorder brands
    reorderBrands: async (req, res) => {
        try {
            const { orders } = req.body; // Array of {id, sort_order}
            
            if (!Array.isArray(orders) || orders.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'orders array is required'
                });
            }

            await Brand.updateSortOrders(orders);

            res.status(200).json({
                success: true,
                message: 'Brands reordered successfully'
            });
        } catch (error) {
            console.error('Error in reorderBrands:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reorder brands',
                error: error.message
            });
        }
    }
};

module.exports = brandController;