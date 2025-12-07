const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;
    
    console.log('🔒 Auth middleware hit');
    console.log('🔒 Headers:', req.headers.authorization);
    console.log('🔒 JWT_SECRET exists:', !!process.env.JWT_SECRET);

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔒 Token extracted:', token.substring(0, 20) + '...');
    }

    // Check if token exists
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
    }

    try {
      // Verify token
      console.log('🔒 Verifying token with secret:', process.env.JWT_SECRET ? 'SECRET EXISTS' : 'NO SECRET');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔒 Token decoded:', decoded);
      
      // Get user from token
      const user = await User.findById(decoded.id);
      console.log('🔒 Decoded ID:', decoded.id, 'Type:', typeof decoded.id);
      console.log('🔒 User lookup result:', user ? `Found: ${user.email} (user_id: ${user.user_id})` : 'NOT FOUND');
      
      if (!user) {
        console.log('❌ User not found with ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not found'
        });
      }

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Account is disabled'
        });
      }

      // Add user to request
      req.user = user;
      console.log('✅ Authentication successful');
      next();
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Optional auth - don't require authentication but set user if token exists
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, continue as guest
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id);
      
      if (user && user.is_active) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (error) {
      // If token is invalid, continue as guest
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Authorize roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};

// Alias for protect (backward compatibility)
const authenticateToken = protect;

// Admin role requirement
const requireAdmin = authorize('admin');

module.exports = {
  protect,
  authorize,
  optionalAuth,
  authenticateToken,
  requireAdmin
};