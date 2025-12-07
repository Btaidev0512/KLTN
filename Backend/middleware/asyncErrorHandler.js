/**
 * Async Error Handler Middleware
 * Wraps async route handlers to catch errors automatically
 * Prevents server crashes from unhandled promise rejections
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('\n' + '='.repeat(80));
    console.error('❌ ASYNC ERROR CAUGHT - ' + new Date().toISOString());
    console.error('='.repeat(80));
    console.error('Route:', req.method, req.originalUrl);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('='.repeat(80) + '\n');

    // Log to file
    const fs = require('fs');
    const path = require('path');
    const errorLog = `
[${new Date().toISOString()}] ASYNC ERROR
Route: ${req.method} ${req.originalUrl}
User: ${req.user ? req.user.email : 'Not authenticated'}
Body: ${JSON.stringify(req.body)}
Error: ${error.message}
Stack: ${error.stack}
${'='.repeat(80)}
`;
    fs.appendFileSync(path.join(__dirname, '../../backend-async-errors.log'), errorLog);

    // Send error response
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  });
};

module.exports = asyncHandler;
