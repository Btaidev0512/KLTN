const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, requireAdmin } = require('../middleware/auth');

// GET all settings
router.get('/', protect, requireAdmin, settingsController.getAllSettings);

// GET settings metadata (categories)
router.get('/meta/categories', protect, requireAdmin, settingsController.getCategories);

// GET settings as object
router.get('/object', protect, requireAdmin, settingsController.getSettingsAsObject);

// GET settings by category
router.get('/category/:category', protect, requireAdmin, settingsController.getSettingsByCategory);

// GET single setting
router.get('/:key', protect, requireAdmin, settingsController.getSetting);

// UPDATE multiple settings
router.put('/', protect, requireAdmin, settingsController.updateMultipleSettings);

// UPDATE single setting
router.put('/:key', protect, requireAdmin, settingsController.updateSetting);

// CREATE new setting
router.post('/', protect, requireAdmin, settingsController.createSetting);

// DELETE setting
router.delete('/:key', protect, requireAdmin, settingsController.deleteSetting);

module.exports = router;
