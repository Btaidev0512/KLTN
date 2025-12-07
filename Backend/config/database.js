const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce_db',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 100, // Tăng lên 100 để tránh pool exhausted
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    maxIdle: 20, // Maximum idle connections
    idleTimeout: 60000, // 60 seconds
    connectTimeout: 20000 // 20 seconds timeout cho connection
});

// Get the promise-based version
const promisePool = pool.promise();

// Test connection
async function testConnection() {
    try {
        const [rows] = await promisePool.execute('SELECT 1 as test');
        console.log('✅ Connected to MySQL database successfully');
        
        // Test database exists
        const [dbResult] = await promisePool.execute('SELECT DATABASE() as db_name');
        console.log('📊 Database:', dbResult[0].db_name);
        
        // Test users table
        const [userCount] = await promisePool.execute('SELECT COUNT(*) as count FROM users');
        console.log('👥 Users in database:', userCount[0].count);
        
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Execute query helper với better error handling
async function executeQuery(query, params = []) {
    let connection;
    try {
        // Kiểm tra params có undefined không
        const cleanParams = params.map(param => param === undefined ? null : param);
        
        // Acquire connection từ pool
        connection = await promisePool.getConnection();
        
        const [rows, fields] = await connection.execute(query, cleanParams);
        
        // Release connection ngay sau khi xong
        connection.release();
        
        return [rows, fields];
    } catch (error) {
        // Đảm bảo release connection nếu có lỗi
        if (connection) {
            try {
                connection.release();
            } catch (releaseError) {
                console.error('Error releasing connection:', releaseError.message);
            }
        }
        
        console.error('Database query error:', error.message);
        console.error('Query:', query);
        console.error('Params:', params);
        throw error;
    }
}

// Monitor connection pool status
function monitorPool() {
    setInterval(() => {
        const poolStatus = pool.pool;
        if (poolStatus && poolStatus._allConnections) {
            const stats = {
                all: poolStatus._allConnections.length,
                free: poolStatus._freeConnections.length,
                queue: poolStatus._connectionQueue.length
            };
            
            // Chỉ log nếu có vấn đề
            if (stats.free < 10 || stats.queue > 5) {
                console.log('⚠️ Connection Pool:', stats);
                
                // Warning if pool is getting full
                if (stats.free < 10) {
                    console.warn('⚠️ Warning: Only', stats.free, 'free connections remaining!');
                }
                
                // Warning if queue is building up
                if (stats.queue > 5) {
                    console.warn('⚠️ Warning:', stats.queue, 'queries waiting in queue!');
                }
            }
        }
    }, 30000); // Log every 30 seconds thay vì 60
}

// Health check - test connection periodically
function healthCheck() {
    setInterval(async () => {
        try {
            await promisePool.execute('SELECT 1');
            // console.log('✅ Database connection healthy');
        } catch (error) {
            console.error('❌ Database health check failed:', error.message);
            console.log('🔄 Attempting to reconnect...');
            
            // Try to reconnect
            try {
                await testConnection();
                console.log('✅ Reconnected successfully');
            } catch (reconnectError) {
                console.error('❌ Reconnection failed:', reconnectError.message);
            }
        }
    }, 30000); // Check every 30 seconds
}

// Start monitoring in development
if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Starting connection pool monitoring...');
    monitorPool();
    healthCheck();
}

// Graceful shutdown
async function closePool() {
    try {
        await pool.end();
        console.log('✅ Database pool closed');
    } catch (error) {
        console.error('❌ Error closing pool:', error);
    }
}

module.exports = {
    execute: executeQuery,
    pool: promisePool,
    getConnection: () => promisePool.getConnection(),
    testConnection,
    closePool
};