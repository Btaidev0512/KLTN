const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');

const router = express.Router();

// Log middleware để debug
router.use((req, res, next) => {
    console.log(`🔍 Users route: ${req.method} ${req.originalUrl}`);
    console.log('🔍 Headers:', req.headers);
    console.log('🔍 Body:', req.body);
    next();
});

// Tất cả users routes cần authentication
router.use(protect);

// Get User Profile
router.get('/profile', async (req, res) => {
    console.log('👤 Get User Profile route hit');
    console.log('👤 User from token:', req.user);
    try {
        await getProfile(req, res);
    } catch (error) {
        console.error('❌ Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Get profile failed', 
            error: error.message 
        });
    }
});

// Get User Orders - For Profile page (exclude completed orders)
// ✅ MUST come BEFORE /:id route to avoid conflict
router.get('/orders', async (req, res) => {
    console.log('📋 Get User Orders route hit');
    console.log('📋 User from token:', req.user);
    console.log('📋 Query params:', req.query);
    
    try {
        const { page = 1, limit = 10, status, excludeCompleted = 'true' } = req.query;
        const userId = req.user.user_id;
        
        console.log('📋 Fetching orders for user:', userId);
        console.log('📋 Page:', page, 'Limit:', limit, 'Status:', status);
        console.log('📋 Exclude completed:', excludeCompleted);
        
        // Import Order model
        const Order = require('../models/Order');
        
        // Get orders for the user
        let orders = await Order.getUserOrders(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            status: status
        });
        
        // ✅ Filter out completed orders for Profile page
        if (excludeCompleted === 'true') {
            orders = orders.filter(order => order.status !== 'completed' && order.status !== 'delivered');
            console.log('📋 Orders after filtering completed:', orders.length);
        }
        
        console.log('📋 Orders found:', orders.length);
        
        res.json({
            success: true,
            message: 'User orders retrieved successfully',
            data: {
                orders: orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: orders.length
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Get user orders error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve user orders', 
            error: error.message 
        });
    }
});

// Update User Profile
router.put('/profile', async (req, res) => {
    console.log('✏️ Update User Profile route hit');
    console.log('✏️ User from token:', req.user);
    console.log('✏️ Update data:', req.body);
    try {
        await updateProfile(req, res);
    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Update profile failed', 
            error: error.message 
        });
    }
});

// Change Password
router.put('/change-password', async (req, res) => {
    console.log('🔐 Change Password route hit');
    console.log('🔐 User from token:', req.user);
    try {
        await changePassword(req, res);
    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Change password failed', 
            error: error.message 
        });
    }
});

// Get User by ID - ⚠️ MUST come AFTER /orders to avoid route conflict
router.get('/:id', async (req, res) => {
    console.log('👤 Get User by ID route hit');
    console.log('👤 User ID:', req.params.id);
    console.log('👤 Current user:', req.user);
    try {
        // Đảm bảo người dùng chỉ có thể xem thông tin của chính họ
        if (req.user.user_id !== parseInt(req.params.id)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập thông tin này'
            });
        }
        
        await getProfile(req, res);
    } catch (error) {
        console.error('❌ Get user by ID error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Get user failed', 
            error: error.message 
        });
    }
});

// User addresses management
router.get('/addresses', async (req, res) => {
    try {
        const userId = req.user.id;
        const User = require('../models/User');
        
        const addresses = await User.getUserAddresses(userId);
        
        res.json({
            success: true,
            message: 'Addresses retrieved successfully',
            data: addresses
        });
    } catch (error) {
        console.error('❌ Get addresses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get addresses',
            error: error.message
        });
    }
});

router.post('/addresses', async (req, res) => {
    try {
        const userId = req.user.id;
        const addressData = { ...req.body, user_id: userId };
        const User = require('../models/User');
        
        const address = await User.createAddress(addressData);
        
        res.json({
            success: true,
            message: 'Address created successfully',
            data: address
        });
    } catch (error) {
        console.error('❌ Create address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create address',
            error: error.message
        });
    }
});

router.put('/addresses/:id', async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = req.user.id;
        const User = require('../models/User');
        
        const address = await User.updateAddress(addressId, userId, req.body);
        
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Address updated successfully',
            data: address
        });
    } catch (error) {
        console.error('❌ Update address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update address',
            error: error.message
        });
    }
});

router.delete('/addresses/:id', async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = req.user.id;
        const User = require('../models/User');
        
        const result = await User.deleteAddress(addressId, userId);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete address',
            error: error.message
        });
    }
});

module.exports = router;