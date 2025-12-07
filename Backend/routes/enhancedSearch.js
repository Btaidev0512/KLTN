// 🔍 ENHANCED SEARCH ROUTES - PHASE 1
const express = require('express');
const router = express.Router();
const EnhancedSearchController = require('../controllers/enhancedSearchController');

// 🔤 Enhanced product search with faceted filters
router.get('/products', EnhancedSearchController.searchProducts);

// 🎛️ Get available filters for faceted search
router.get('/filters', EnhancedSearchController.getAvailableFilters);

// ⚡ Auto-complete suggestions
router.get('/suggestions', EnhancedSearchController.getSearchSuggestions);

// 🔍 Quick search (simplified, fast response)
router.get('/quick', EnhancedSearchController.quickSearch);

// 📈 Get popular searches
router.get('/popular', EnhancedSearchController.getPopularSearches);

// 📊 Search analytics (admin only) - simplified without auth for now
router.get('/analytics', EnhancedSearchController.getSearchAnalytics);

module.exports = router;