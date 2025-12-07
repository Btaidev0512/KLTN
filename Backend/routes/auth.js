const express = require('express');
const rateLimit = require('express-rate-limit'); // 🔒 Import rate limit
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
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword
} = require('../middleware/validation');

const router = express.Router();

// 🔒 Strict rate limiter for sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (giảm từ 15 phút)
  max: 50, // 50 attempts (tăng từ 5 cho development)
  message: {
    success: false,
    message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 5 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Chỉ đếm request thất bại
});

// Public routes with rate limiting
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, forgotPassword); // Rate limit forgot password
router.post('/reset-password', resetPassword);

// Protected routes
router.use(protect); // All routes below this middleware require authentication

router.get('/profile', getProfile);
router.put('/profile', validateUpdateProfile, updateProfile);
router.put('/change-password', changePassword); // Loại bỏ validation tạm thời
router.post('/logout', logout);

module.exports = router;