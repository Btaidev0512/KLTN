// 🔍 ENHANCED SEARCH CONTROLLER - PHASE 1
const EnhancedSearch = require('../models/EnhancedSearch');

class EnhancedSearchController {

    // 🔤 Enhanced product search với faceted filters
    static async searchProducts(req, res) {
        try {
            const {
                q: query = '',
                category = null,
                brand = null,
                min_price = null,
                max_price = null,
                min_rating = null,
                sort = 'relevance',
                page = 1,
                limit = 20,
                in_stock = false
            } = req.query;

            // Validate and convert parameters
            const searchParams = {
                query: query.trim(),
                category_id: category ? parseInt(category) : null,
                brand_id: brand ? parseInt(brand) : null,
                min_price: min_price ? parseFloat(min_price) : null,
                max_price: max_price ? parseFloat(max_price) : null,
                min_rating: min_rating ? parseFloat(min_rating) : null,
                sort_by: sort,
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 50), // Max 50 per page
                in_stock_only: in_stock === 'true'
            };

            // Perform enhanced search
            const searchResult = await EnhancedSearch.searchProducts(searchParams);

            // Track search analytics (async, don't wait)
            if (query) {
                const userId = req.user ? req.user.user_id : null;
                EnhancedSearch.trackSearchQuery(query, userId, searchResult.pagination.total)
                    .catch(err => console.error('Analytics tracking failed:', err));
            }

            return res.status(200).json({
                success: true,
                message: 'Search completed successfully',
                data: {
                    query: query,
                    filters_applied: {
                        category: searchParams.category_id,
                        brand: searchParams.brand_id,
                        price_range: {
                            min: searchParams.min_price,
                            max: searchParams.max_price
                        },
                        min_rating: searchParams.min_rating,
                        in_stock_only: searchParams.in_stock_only
                    },
                    sort_by: searchParams.sort_by,
                    products: searchResult.products,
                    pagination: searchResult.pagination
                }
            });

        } catch (error) {
            console.error('Enhanced search error:', error);
            return res.status(500).json({
                success: false,
                message: 'Search failed',
                error: error.message
            });
        }
    }

    // 🎛️ Get available filters for faceted search
    static async getAvailableFilters(req, res) {
        try {
            const { q: query = '' } = req.query;

            const filters = await EnhancedSearch.getAvailableFilters(query.trim());

            return res.status(200).json({
                success: true,
                message: 'Filters retrieved successfully',
                data: {
                    query: query,
                    available_filters: filters
                }
            });

        } catch (error) {
            console.error('Get filters error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get available filters',
                error: error.message
            });
        }
    }

    // ⚡ Auto-complete suggestions
    static async getSearchSuggestions(req, res) {
        try {
            const { q: query = '', limit = 10 } = req.query;

            if (!query || query.trim().length < 2) {
                return res.status(200).json({
                    success: true,
                    message: 'Query too short for suggestions',
                    data: {
                        suggestions: []
                    }
                });
            }

            const suggestions = await EnhancedSearch.getSearchSuggestions(
                query.trim(), 
                Math.min(parseInt(limit), 20)
            );

            return res.status(200).json({
                success: true,
                message: 'Suggestions retrieved successfully',
                data: {
                    query: query.trim(),
                    suggestions: suggestions
                }
            });

        } catch (error) {
            console.error('Search suggestions error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get search suggestions',
                error: error.message
            });
        }
    }

    // 📈 Get popular searches
    static async getPopularSearches(req, res) {
        try {
            const { limit = 10 } = req.query;

            const popularSearches = await EnhancedSearch.getPopularSearches(
                Math.min(parseInt(limit), 50)
            );

            return res.status(200).json({
                success: true,
                message: 'Popular searches retrieved successfully',
                data: {
                    popular_searches: popularSearches
                }
            });

        } catch (error) {
            console.error('Popular searches error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get popular searches',
                error: error.message
            });
        }
    }

    // 🔍 Quick search (simplified version)
    static async quickSearch(req, res) {
        try {
            const { q: query = '', limit = 5 } = req.query;

            if (!query || query.trim().length < 2) {
                return res.status(200).json({
                    success: true,
                    message: 'Query too short',
                    data: { results: [] }
                });
            }

            // Quick search với basic parameters
            const searchResult = await EnhancedSearch.searchProducts({
                query: query.trim(),
                limit: Math.min(parseInt(limit), 10),
                sort_by: 'relevance'
            });

            // Return simplified response
            const quickResults = searchResult.products.map(product => ({
                product_id: product.product_id,
                name: product.name,
                price: product.price,
                main_image: product.main_image,
                avg_rating: parseFloat(product.avg_rating) || 0,
                brand_name: product.brand_name
            }));

            return res.status(200).json({
                success: true,
                message: 'Quick search completed',
                data: {
                    query: query.trim(),
                    results: quickResults,
                    total_found: searchResult.pagination.total
                }
            });

        } catch (error) {
            console.error('Quick search error:', error);
            return res.status(500).json({
                success: false,
                message: 'Quick search failed',
                error: error.message
            });
        }
    }

    // 📊 Search analytics endpoint (for admin)
    static async getSearchAnalytics(req, res) {
        try {
            const { days = 30, limit = 20 } = req.query;

            // Get popular searches
            const popularSearches = await EnhancedSearch.getPopularSearches(limit);

            // Additional analytics could be added here
            const analytics = {
                period_days: parseInt(days),
                popular_searches: popularSearches,
                generated_at: new Date().toISOString()
            };

            return res.status(200).json({
                success: true,
                message: 'Search analytics retrieved successfully',
                data: analytics
            });

        } catch (error) {
            console.error('Search analytics error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get search analytics',
                error: error.message
            });
        }
    }
}

module.exports = EnhancedSearchController;