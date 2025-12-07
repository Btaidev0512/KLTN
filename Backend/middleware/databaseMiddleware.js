const { pool } = require('../config/database');

// Middleware bắt tất cả lỗi database và prevent crash
const databaseErrorHandler = async (req, res, next) => {
    // Wrap tất cả operations trong try-catch
    const originalJson = res.json;
    
    res.json = function(data) {
        try {
            return originalJson.call(this, data);
        } catch (error) {
            console.error('❌ Error sending response:', error);
            if (!res.headersSent) {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    };
    
    next();
};

// Check database health trước mỗi request
// Cache kết quả trong 10s để tránh ping quá nhiều
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 10000; // 10 seconds

const checkDatabaseHealth = async (req, res, next) => {
    try {
        const now = Date.now();
        
        // Skip health check nếu vừa mới check (trong vòng 10s)
        if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
            return next();
        }
        
        // Ping database với timeout ngắn
        const connection = await Promise.race([
            pool.getConnection(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database connection timeout')), 5000)
            )
        ]);
        
        await connection.ping();
        connection.release();
        
        lastHealthCheck = now; // Update last check time
        next();
    } catch (error) {
        console.error('❌ Database health check failed:', error.message);
        
        if (!res.headersSent) {
            return res.status(503).json({
                success: false,
                message: 'Database temporarily unavailable',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = {
    databaseErrorHandler,
    checkDatabaseHealth
};
