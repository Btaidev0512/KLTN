// Middleware để prevent request timeout
const requestTimeout = (req, res, next) => {
    // Set timeout 30 seconds cho mỗi request
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            console.error(`⏱️ Request timeout: ${req.method} ${req.originalUrl}`);
            res.status(504).json({
                success: false,
                message: 'Request timeout - Server is taking too long to respond'
            });
        }
    }, 30000); // 30 seconds

    // Clear timeout khi response được send
    res.on('finish', () => {
        clearTimeout(timeout);
    });

    res.on('close', () => {
        clearTimeout(timeout);
    });

    next();
};

module.exports = requestTimeout;
