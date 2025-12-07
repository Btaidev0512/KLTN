const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/active', bannerController.getActiveBanners);

// Admin routes - require authentication and admin role
router.get('/', authenticateToken, requireAdmin, bannerController.getAllBannersAdmin);
router.get('/:id', authenticateToken, requireAdmin, bannerController.getBannerById);
router.post('/', authenticateToken, requireAdmin, bannerController.createBanner);
router.put('/:id', authenticateToken, requireAdmin, bannerController.updateBanner);
router.put('/:id/toggle', authenticateToken, requireAdmin, bannerController.toggleBannerStatus);
router.put('/reorder/batch', authenticateToken, requireAdmin, bannerController.updateBannerOrder);
router.delete('/:id', authenticateToken, requireAdmin, bannerController.deleteBanner);

module.exports = router;
