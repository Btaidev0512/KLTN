const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Log để debug
router.use((req, res, next) => {
    console.log(`🔍 Auth route: ${req.method} ${req.originalUrl}`);
    console.log('🔍 Body:', req.body);
    next();
});

// Public routes - không có validation để test
router.post('/register', async (req, res) => {
    console.log('📝 Register route hit');
    try {
        await register(req, res);
    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({ success: false, message: 'Register failed', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    console.log('🔑 Login route hit');
    try {
        await login(req, res);
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
});

router.post('/forgot-password', async (req, res) => {
    console.log('🔒 Forgot password route hit');
    console.log('🔒 Request body:', req.body);
    try {
        await forgotPassword(req, res);
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Forgot password failed', error: error.message });
    }
});

router.post('/reset-password', async (req, res) => {
    console.log('🔄 Reset password route hit');
    console.log('🔄 Request body:', req.body);
    try {
        await resetPassword(req, res);
    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({ success: false, message: 'Reset password failed', error: error.message });
    }
});

// Protected routes
router.use(protect); // Middleware cho các route cần authentication

router.get('/profile', async (req, res) => {
    console.log('👤 Profile route hit');
    try {
        await getProfile(req, res);
    } catch (error) {
        console.error('❌ Profile error:', error);
        res.status(500).json({ success: false, message: 'Profile failed', error: error.message });
    }
});

router.put('/profile', async (req, res) => {
    console.log('✏️ Update profile route hit');
    try {
        await updateProfile(req, res);
    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({ success: false, message: 'Update profile failed', error: error.message });
    }
});

router.put('/change-password', async (req, res) => {
    console.log('🔐 Change password route hit');
    try {
        await changePassword(req, res);
    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({ success: false, message: 'Change password failed', error: error.message });
    }
});

router.post('/logout', async (req, res) => {
    console.log('👋 Logout route hit');
    try {
        await logout(req, res);
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({ success: false, message: 'Logout failed', error: error.message });
    }
});

module.exports = router;