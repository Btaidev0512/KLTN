const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http'); // 🌐 For WebSocket server
const mongoSanitize = require('express-mongo-sanitize'); // 🔒 Prevent NoSQL injection
require('dotenv').config();

// Import database connection
const { testConnection, closePool } = require('./config/database');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { requestTracker, getStats } = require('./middleware/requestTracker');
const requestTimeout = require('./middleware/requestTimeout');
const { databaseErrorHandler, checkDatabaseHealth } = require('./middleware/databaseMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const usersRoutes = require('./routes/users');
const brandsRoutes = require('./routes/brands');
const productsRoutes = require('./routes/products'); // 🔧 Fixed: products_new → products
const enhancedSearchRoutes = require('./routes/enhancedSearch'); // 🔍 Enhanced Search Routes
const chatRoutes = require('./routes/chat'); // 🤖 AI Chat Routes
const settingsRoutes = require('./routes/settings'); // ⚙️ Settings Routes (Admin)
const settingsPublicRoutes = require('./routes/settings-public'); // ⚙️ Public Settings Routes

// Import WebSocket service
const WebSocketService = require('./services/websocketService'); // 🌐 WebSocket Service

const app = express();
const server = http.createServer(app); // 🌐 HTTP server for WebSocket
const PORT = process.env.PORT || 5000;

// Security middleware - DISABLE CSP for AI Chat Box
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // 🔧 DISABLE CSP completely for AI Chat
}));

// Rate limiting - Adjusted for multiple tabs/windows
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 999999 : 5000, // Tắt limit cho dev
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  // Skip rate limit for certain paths
  skip: (req) => {
    // Skip health check và dashboard routes, hoặc toàn bộ nếu là development
    return process.env.NODE_ENV === 'development' ||
           req.path === '/health' || 
           req.path === '/' || 
           req.path.startsWith('/api/dashboard');
  }
});
app.use('/api', limiter);

// ✅ CORS Configuration - Improved & Simplified
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com'  // URL production (thay đổi khi deploy)
    : 'http://localhost:3000',   // URL development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-session-id', 
    'x-tab-id', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['x-session-id'],
  maxAge: 86400, // 24 hours - cache preflight requests
  optionsSuccessStatus: 200
};

// ✅ Apply CORS middleware BEFORE all routes
app.use(cors(corsOptions));

// ✅ Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// 🔧 THÊM MIDDLEWARE XỬ LÝ CORS THỦ CÔNG - Fix preflight request
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id, x-tab-id, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Body parsing middleware - Tăng giới hạn và thêm error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('❌ Invalid JSON:', e.message);
      res.status(400).json({ success: false, message: 'Invalid JSON format' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 🔒 Security: Sanitize data to prevent NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized potentially malicious data in ${key}`);
  }
}));

// Compression middleware
app.use(compression());

// Rate limiting - Ngăn quá nhiều requests đồng thời
const rateLimiter = require('./middleware/rateLimiter');
app.use(rateLimiter);

// Database error handler - PHẢI ĐẶT TRƯỚC CÁC ROUTES
app.use(databaseErrorHandler);

// Request timeout middleware
app.use(requestTimeout);

// Request tracking middleware
app.use(requestTracker);

// Database health check cho tất cả API routes
app.use('/api', checkDatabaseHealth);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  
  // Custom request logger for debugging multiple tabs
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📨 [${timestamp}] ${req.method} ${req.path} - Tab: ${req.headers['x-tab-id'] || 'unknown'}`);
    
    // Log response when finished
    const originalSend = res.send;
    res.send = function (data) {
      console.log(`✅ [${timestamp}] Response: ${req.method} ${req.path} - Status: ${res.statusCode}`);
      return originalSend.call(this, data);
    };
    
    // Log errors
    res.on('error', (error) => {
      console.error(`❌ [${timestamp}] Error on ${req.method} ${req.path}:`, error.message);
    });
    
    next();
  });
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public'))); // 🎨 Public files for demo

// Initialize database connection
const initializeDatabase = async () => {
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Badminton Store API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Server stats endpoint (development only)
app.get('/api/stats', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ success: false, message: 'Not available in production' });
  }
  
  const stats = getStats();
  res.json({
    success: true,
    data: {
      ...stats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
});

// API welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Badminton Store API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// DIRECT TEST ROUTES - để debug
app.post('/api/auth/test-forgot', async (req, res) => {
    console.log('🧪 DIRECT FORGOT PASSWORD TEST HIT!');
    console.log('Body:', req.body);
    
    try {
        // Import controller trực tiếp
        const { forgotPassword } = require('./controllers/authController');
        await forgotPassword(req, res);
    } catch (error) {
        console.error('Direct test error:', error);
        res.status(500).json({
            success: false,
            message: 'Direct test error',
            error: error.message
        });
    }
});

app.post('/api/auth/test-reset', async (req, res) => {
    console.log('🧪 DIRECT RESET PASSWORD TEST HIT!');
    console.log('Body:', req.body);
    
    try {
        // Import controller trực tiếp
        const { resetPassword } = require('./controllers/authController');
        await resetPassword(req, res);
    } catch (error) {
        console.error('Direct reset test error:', error);
        res.status(500).json({
            success: false,
            message: 'Direct reset test error',
            error: error.message
        });
    }
});

app.put('/api/auth/test-change', async (req, res) => {
    console.log('🧪 DIRECT CHANGE PASSWORD TEST HIT!');
    console.log('Body:', req.body);
    
    try {
        // Import middleware và controller
        const { protect } = require('./middleware/auth');
        const { changePassword } = require('./controllers/authController');
        
        // Chạy protect middleware trước
        await new Promise((resolve, reject) => {
            protect(req, res, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
        
        await changePassword(req, res);
    } catch (error) {
        console.error('Direct change test error:', error);
        res.status(500).json({
            success: false,
            message: 'Direct change test error',
            error: error.message
        });
    }
});

// Direct test routes cho users
app.get('/api/users/test-profile', async (req, res) => {
    console.log('🧪 DIRECT GET PROFILE TEST HIT!');
    console.log('Headers:', req.headers);
    
    try {
        const { protect } = require('./middleware/auth');
        const { getProfile } = require('./controllers/authController');
        
        // Chạy protect middleware
        await new Promise((resolve, reject) => {
            protect(req, res, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
        
        await getProfile(req, res);
    } catch (error) {
        console.error('Direct get profile test error:', error);
        res.status(500).json({
            success: false,
            message: 'Direct get profile test error',
            error: error.message
        });
    }
});

app.put('/api/users/test-update-profile', async (req, res) => {
    console.log('🧪 DIRECT UPDATE PROFILE TEST HIT!');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    try {
        const { protect } = require('./middleware/auth');
        const { updateProfile } = require('./controllers/authController');
        
        // Chạy protect middleware
        await new Promise((resolve, reject) => {
            protect(req, res, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
        
        await updateProfile(req, res);
    } catch (error) {
        console.error('Direct update profile test error:', error);
        res.status(500).json({
            success: false,
            message: 'Direct update profile test error',
            error: error.message
        });
    }
});

// 🔒 Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Tăng lên 100 cho development (5 → 100)
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// API Routes for business logic
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/products', require('./routes/productVariants')); // 📦 Product Variants (Size + Stock)
app.use('/api/product-attributes', require('./routes/productAttributes')); // Product attributes system
app.use('/api/search', enhancedSearchRoutes); // 🔍 Enhanced Search (unified endpoint)
app.use('/api/chat', chatRoutes); // 🤖 AI Chat

// ⚙️ Settings Routes
app.use('/api/admin/settings', settingsRoutes); // Admin settings (protected)
app.use('/api/settings', settingsPublicRoutes); // Public settings (no auth)

// Import and use cart routes
const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);

// Import and use order routes
const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

// Import and use review routes
const reviewRoutes = require('./routes/reviews');
app.use('/api/reviews', reviewRoutes);

// Import and use wishlist routes
const wishlistRoutes = require('./routes/wishlist');
app.use('/api/wishlist', wishlistRoutes);

// Import and use payment routes
app.use('/api/payments', require('./routes/payments'));

// Import and use admin routes
app.use('/api/admin', require('./routes/admin'));

// Import and use dashboard routes
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);

// Import and use coupon routes
const couponRoutes = require('./routes/coupons');
app.use('/api/coupons', couponRoutes);

// Import and use admin coupon routes
const adminCouponRoutes = require('./routes/adminCoupons');
app.use('/api/admin/coupons', adminCouponRoutes);

// Import and use admin review routes
const adminReviewRoutes = require('./routes/adminReviews');
app.use('/api/admin/reviews', adminReviewRoutes);

// Import and use banner routes
const bannerRoutes = require('./routes/banners');
app.use('/api/banners', bannerRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Initialize WebSocket service
    console.log('🌐 Initializing WebSocket service...');
    WebSocketService.initialize(server);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🏪 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🤖 AI Chat Box: http://localhost:${PORT}/api/chat`);
      console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
      console.log('🎾 Badminton Store API with AI Chat Ready!');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  const { pool } = require('./config/database');
  
  pool.end().then(() => {
    console.log('Database connections closed');
    process.exit(0);
  }).catch((error) => {
    console.error('Error during shutdown:', error);
    process.exit(1);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions - KHÔNG BAO GIỜ CHO PHÉP SILENT CRASH
process.on('uncaughtException', (error) => {
  console.error('\n' + '🚨'.repeat(40));
  console.error('❌ UNCAUGHT EXCEPTION DETECTED - ' + new Date().toISOString());
  console.error('🚨'.repeat(40));
  console.error('Error Name:', error.name);
  console.error('Error Message:', error.message);
  console.error('Error Code:', error.code);
  console.error('Stack Trace:\n', error.stack);
  console.error('🚨'.repeat(40) + '\n');
  
  // Write to error log file
  const fs = require('fs');
  const errorLog = `
${'='.repeat(80)}
[${new Date().toISOString()}] UNCAUGHT EXCEPTION
Name: ${error.name}
Message: ${error.message}
Code: ${error.code}
Stack: ${error.stack}
${'='.repeat(80)}

`;
  try {
    fs.appendFileSync(path.join(__dirname, '../backend-crash.log'), errorLog);
    console.log('📝 Error logged to backend-crash.log');
  } catch (logError) {
    console.error('Failed to write error log:', logError.message);
  }
  
  // LUÔN RESTART sau uncaught exception
  console.error('⚠️ RESTARTING SERVER in 2 seconds...');
  setTimeout(() => {
    process.exit(1); // Exit code 1 để PM2/nodemon auto restart
  }, 2000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n' + '⚠️'.repeat(40));
  console.error('❌ UNHANDLED REJECTION DETECTED - ' + new Date().toISOString());
  console.error('⚠️'.repeat(40));
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack);
  }
  console.error('⚠️'.repeat(40) + '\n');
  
  // Write to error log file
  const fs = require('fs');
  const errorLog = `
${'='.repeat(80)}
[${new Date().toISOString()}] UNHANDLED REJECTION
Promise: ${JSON.stringify(promise)}
Reason: ${reason}
Stack: ${reason instanceof Error ? reason.stack : 'N/A'}
${'='.repeat(80)}

`;
  try {
    fs.appendFileSync(path.join(__dirname, '../backend-crash.log'), errorLog);
    console.log('📝 Error logged to backend-crash.log');
  } catch (logError) {
    console.error('Failed to write error log:', logError.message);
  }
  
  // LUÔN RESTART sau unhandled rejection
  console.error('⚠️ RESTARTING SERVER in 2 seconds...');
  setTimeout(() => {
    process.exit(1); // Exit code 1 để PM2/nodemon auto restart
  }, 2000);
});

// Start the server
startServer();

module.exports = app;