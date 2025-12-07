const Settings = require('../models/Settings');

// @desc    Get all settings
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getAllSettings = async (req, res) => {
    try {
        const settings = await Settings.getAll();
        
        res.json({
            success: true,
            count: settings.length,
            data: settings
        });
    } catch (error) {
        console.error('Error in getAllSettings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách cài đặt',
            error: error.message
        });
    }
};

// @desc    Get settings by category
// @route   GET /api/admin/settings/category/:category
// @access  Private/Admin
exports.getSettingsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        
        const validCategories = ['general', 'email', 'payment', 'shipping', 'tax', 'advanced'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Category không hợp lệ'
            });
        }
        
        const settings = await Settings.getByCategory(category);
        
        res.json({
            success: true,
            category,
            count: settings.length,
            data: settings
        });
    } catch (error) {
        console.error('Error in getSettingsByCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy cài đặt theo category',
            error: error.message
        });
    }
};

// @desc    Get settings as object (key-value pairs)
// @route   GET /api/admin/settings/object
// @access  Private/Admin
exports.getSettingsAsObject = async (req, res) => {
    try {
        const { category } = req.query;
        const settings = await Settings.getAsObject(category);
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error in getSettingsAsObject:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy settings object',
            error: error.message
        });
    }
};

// @desc    Get single setting by key
// @route   GET /api/admin/settings/:key
// @access  Private/Admin
exports.getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await Settings.getByKey(key);
        
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy setting'
            });
        }
        
        res.json({
            success: true,
            data: setting
        });
    } catch (error) {
        console.error('Error in getSetting:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy setting',
            error: error.message
        });
    }
};

// @desc    Update single setting
// @route   PUT /api/admin/settings/:key
// @access  Private/Admin
exports.updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        
        if (value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp giá trị mới'
            });
        }
        
        // Check if setting exists
        const exists = await Settings.exists(key);
        if (!exists) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy setting'
            });
        }
        
        const updated = await Settings.update(key, value);
        
        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'Không thể cập nhật setting'
            });
        }
        
        res.json({
            success: true,
            message: 'Cập nhật setting thành công'
        });
    } catch (error) {
        console.error('Error in updateSetting:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật setting',
            error: error.message
        });
    }
};

// @desc    Update multiple settings (bulk update)
// @route   PUT /api/admin/settings
// @access  Private/Admin
exports.updateMultipleSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        
        if (!Array.isArray(settings) || settings.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp danh sách settings hợp lệ'
            });
        }
        
        // Validate each setting has key and value
        for (const setting of settings) {
            if (!setting.key || setting.value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Mỗi setting phải có key và value'
                });
            }
        }
        
        const updated = await Settings.updateMultiple(settings);
        
        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'Không thể cập nhật settings'
            });
        }
        
        res.json({
            success: true,
            message: 'Cập nhật settings thành công',
            count: settings.length
        });
    } catch (error) {
        console.error('Error in updateMultipleSettings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật settings',
            error: error.message
        });
    }
};

// @desc    Create new setting
// @route   POST /api/admin/settings
// @access  Private/Admin
exports.createSetting = async (req, res) => {
    try {
        const { key, value, type, category, displayName, description, isPublic } = req.body;
        
        // Validation
        if (!key || !category) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp key và category'
            });
        }
        
        // Check if setting already exists
        const exists = await Settings.exists(key);
        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Setting đã tồn tại'
            });
        }
        
        const settingId = await Settings.create({
            key,
            value,
            type,
            category,
            displayName,
            description,
            isPublic
        });
        
        res.status(201).json({
            success: true,
            message: 'Tạo setting thành công',
            data: { setting_id: settingId }
        });
    } catch (error) {
        console.error('Error in createSetting:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo setting',
            error: error.message
        });
    }
};

// @desc    Delete setting
// @route   DELETE /api/admin/settings/:key
// @access  Private/Admin
exports.deleteSetting = async (req, res) => {
    try {
        const { key } = req.params;
        
        const deleted = await Settings.delete(key);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy setting hoặc không thể xóa'
            });
        }
        
        res.json({
            success: true,
            message: 'Xóa setting thành công'
        });
    } catch (error) {
        console.error('Error in deleteSetting:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa setting',
            error: error.message
        });
    }
};

// @desc    Get categories list
// @route   GET /api/admin/settings/meta/categories
// @access  Private/Admin
exports.getCategories = async (req, res) => {
    try {
        const categories = await Settings.getCategories();
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error in getCategories:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách categories',
            error: error.message
        });
    }
};

// ==========================================
// PUBLIC ENDPOINTS (No Auth Required)
// ==========================================

// @desc    Get public settings (for frontend)
// @route   GET /api/settings/public
// @access  Public
exports.getPublicSettings = async (req, res) => {
    try {
        const settings = await Settings.getPublicSettings();
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error in getPublicSettings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy cài đặt công khai',
            error: error.message
        });
    }
};

// @desc    Get shipping settings (for checkout page)
// @route   GET /api/settings/shipping
// @access  Public
exports.getShippingSettings = async (req, res) => {
    try {
        const shippingSettings = await Settings.getByCategory('shipping');
        
        // Convert array to object for easier frontend use
        const settingsObj = {};
        shippingSettings.forEach(setting => {
            let value = setting.setting_value;
            
            // Parse boolean values
            if (value === 'true' || value === 'false') {
                value = value === 'true';
            }
            // Parse number values
            else if (!isNaN(value) && value !== '') {
                value = parseFloat(value);
            }
            
            settingsObj[setting.setting_key] = value;
        });
        
        res.json({
            success: true,
            data: settingsObj
        });
    } catch (error) {
        console.error('Error in getShippingSettings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy cài đặt vận chuyển',
            error: error.message
        });
    }
};
