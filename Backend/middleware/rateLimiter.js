// Request rate limiting middleware
// Ngăn chặn quá nhiều requests đồng thời làm crash backend

const requestCounts = new Map(); // Track requests per IP
const MAX_REQUESTS_PER_SECOND = 200; // Max requests per second per IP (tăng cho development)
const CLEANUP_INTERVAL = 5000; // Clean up old entries every 5 seconds

// Clean up old request counts
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requestCounts.entries()) {
        if (now - data.lastRequest > CLEANUP_INTERVAL) {
            requestCounts.delete(ip);
        }
    }
}, CLEANUP_INTERVAL);

function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, {
            count: 1,
            firstRequest: now,
            lastRequest: now
        });
        return next();
    }
    
    const data = requestCounts.get(ip);
    const timePassed = now - data.firstRequest;
    
    // Reset counter nếu đã qua 1 giây
    if (timePassed > 1000) {
        requestCounts.set(ip, {
            count: 1,
            firstRequest: now,
            lastRequest: now
        });
        return next();
    }
    
    // Check rate limit
    if (data.count >= MAX_REQUESTS_PER_SECOND) {
        console.warn(`⚠️ Rate limit exceeded for IP: ${ip} (${data.count} requests in ${timePassed}ms)`);
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please slow down.',
            retry_after: Math.ceil((1000 - timePassed) / 1000)
        });
    }
    
    // Increment counter
    data.count++;
    data.lastRequest = now;
    next();
}

module.exports = rateLimiter;
