const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// ==========================================
// PUBLIC ROUTES (No Authentication)
// ==========================================

// Get public settings for frontend
router.get('/public', settingsController.getPublicSettings);

// Get shipping settings for checkout
router.get('/shipping', settingsController.getShippingSettings);

module.exports = router;
