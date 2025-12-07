const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
// Temporarily comment out validation for testing
// const brandValidation = require('../validators/brandValidator');
// const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/', brandController.getAllBrands);
router.get('/popular', brandController.getPopularBrands);
router.get('/countries', brandController.getBrandCountries);
router.get('/search', brandController.searchBrands);
router.get('/country/:country', brandController.getBrandsByCountry);
router.get('/:id(\\d+)', brandController.getBrandById);
router.get('/slug/:slug', brandController.getBrandBySlug);

// Admin routes (without authentication for testing)
router.post('/', brandController.createBrand);
router.put('/:id', brandController.updateBrand);
router.patch('/reorder', brandController.reorderBrands);
router.delete('/:id', brandController.deleteBrand);

module.exports = router;