// 💬 CHAT ROUTES
// API routes for AI Chat Box functionality

const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');

// Basic middleware for all chat routes
router.use((req, res, next) => {
    console.log(`💬 Chat API: ${req.method} ${req.originalUrl}`);
    next();
});

// Health check
router.get('/health', ChatController.healthCheck);

// Start new chat session
// POST /api/chat/start
// Body: { user_id?, user_email?, user_name? }
router.post('/start', ChatController.startChat);

// Send message to AI
// POST /api/chat/message  
// Body: { session_id, message, message_type? }
router.post('/message', ChatController.sendMessage);

// Get chat history
// GET /api/chat/history/:session_id
// Query: { limit?, offset? }
router.get('/history/:session_id', ChatController.getChatHistory);

// End chat session
// POST /api/chat/end
// Body: { session_id, satisfaction?, feedback? }
router.post('/end', ChatController.endChat);

// Get quick replies
// GET /api/chat/quick-replies
// Query: { category? }
router.get('/quick-replies', ChatController.getQuickReplies);

// Search messages
// GET /api/chat/search
// Query: { query, session_id?, limit? }
router.get('/search', ChatController.searchMessages);

// Get chat statistics
// GET /api/chat/stats
// Query: { days? }
router.get('/stats', ChatController.getChatStats);

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('❌ Chat route error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error in chat system',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

module.exports = router;