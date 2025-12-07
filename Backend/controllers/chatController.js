// 💬 CHAT CONTROLLER
// Handles all chat-related API endpoints

const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const ChatSession = require('../models/ChatSession');
const AIProcessor = require('../models/UltraSimpleAI'); // Using ultra simplified version
const { v4: uuidv4 } = require('uuid');

class ChatController {
    
    // Start new chat session
    static async startChat(req, res) {
        try {
            const { user_id, user_email, user_name } = req.body;
            const user_ip = req.ip || req.connection.remoteAddress;
            const user_agent = req.get('User-Agent');
            
            console.log('💬 Starting new chat session...');
            
            // Create conversation
            const conversation = await ChatConversation.startConversation({
                user_id,
                user_email,
                user_name,
                user_ip,
                user_agent
            });
            
            // Get welcome message
            const messages = await ChatMessage.getConversationMessages(conversation.conversation_id, 10);
            
            console.log(`✅ Chat started: ${conversation.session_id}`);
            
            res.status(200).json({
                success: true,
                data: {
                    session_id: conversation.session_id,
                    conversation_id: conversation.conversation_id,
                    messages: messages,
                    quick_replies: [
                        { title: '🔍 Tìm sản phẩm', message: 'Tôi muốn tìm sản phẩm' },
                        { title: '📦 Tra cứu đơn hàng', message: 'Tôi muốn kiểm tra đơn hàng của mình' },
                        { title: '💳 Hỗ trợ thanh toán', message: 'Tôi cần hỗ trợ về thanh toán' }
                    ]
                },
                message: 'Chat session started successfully'
            });
            
        } catch (error) {
            console.error('❌ Start chat error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start chat session',
                error: error.message
            });
        }
    }
    
    // Send message to AI
    static async sendMessage(req, res) {
        try {
            const { session_id, message, message_type = 'text' } = req.body;
            
            if (!session_id || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Session ID and message are required'
                });
            }
            
            console.log(`💬 Message from ${session_id}: "${message.substring(0, 50)}..."`);
            
            // Get conversation
            const conversation = await ChatConversation.getBySessionId(session_id);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat session not found'
                });
            }
            
            // Add user message
            const userMessage = await ChatMessage.addMessage(
                conversation.id,
                'user',
                message,
                message_type
            );
            
            // Process with AI
            const aiResponse = await AIProcessor.processMessage(
                conversation.id,
                message,
                session_id
            );
            
            // Update session activity
            await ChatSession.updateActivity(session_id);
            
            console.log(`✅ AI response generated for session: ${session_id}`);
            
            res.status(200).json({
                success: true,
                data: {
                    user_message: userMessage,
                    ai_response: aiResponse.message,
                    intent: aiResponse.intent,
                    confidence: aiResponse.confidence,
                    response_time: aiResponse.responseTime,
                    session_id: session_id
                },
                message: 'Message processed successfully'
            });
            
        } catch (error) {
            console.error('❌ Send message error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process message',
                error: error.message
            });
        }
    }
    
    // Get chat history
    static async getChatHistory(req, res) {
        try {
            const { session_id } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            
            console.log(`📄 Getting chat history for: ${session_id}`);
            
            // Get conversation
            const conversation = await ChatConversation.getBySessionId(session_id);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat session not found'
                });
            }
            
            // Get messages
            const messages = await ChatMessage.getConversationMessages(
                conversation.id,
                parseInt(limit),
                parseInt(offset)
            );
            
            // Get session info
            const session = await ChatSession.getSession(session_id);
            
            res.status(200).json({
                success: true,
                data: {
                    conversation: conversation,
                    messages: messages,
                    session: session,
                    total_messages: conversation.total_messages
                },
                message: 'Chat history retrieved successfully'
            });
            
        } catch (error) {
            console.error('❌ Get history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get chat history',
                error: error.message
            });
        }
    }
    
    // End chat session
    static async endChat(req, res) {
        try {
            const { session_id } = req.body;
            const { satisfaction, feedback } = req.body;
            
            console.log(`🖼️ Ending chat session: ${session_id}`);
            
            // Get conversation
            const conversation = await ChatConversation.getBySessionId(session_id);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Chat session not found'
                });
            }
            
            // Close conversation
            await ChatConversation.closeConversation(conversation.id, satisfaction);
            
            // Close session
            await ChatSession.closeSession(session_id);
            
            // Add farewell message
            await ChatMessage.addMessage(
                conversation.id,
                'system',
                'Cảm ơn bạn đã sử dụng dịch vụ hỗ trợ của chúng tôi. Chúc bạn một ngày tốt lành! 😊',
                'text'
            );
            
            console.log(`✅ Chat session ended: ${session_id}`);
            
            res.status(200).json({
                success: true,
                data: {
                    session_id: session_id,
                    status: 'closed',
                    satisfaction: satisfaction
                },
                message: 'Chat session ended successfully'
            });
            
        } catch (error) {
            console.error('❌ End chat error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to end chat session',
                error: error.message
            });
        }
    }
    
    // Get quick replies
    static async getQuickReplies(req, res) {
        try {
            const { category = 'support' } = req.query;
            
            const db = require('../config/database');
            const [replies] = await db.execute(`
                SELECT title, message, category FROM chat_quick_replies
                WHERE category = ? AND is_active = TRUE
                ORDER BY display_order ASC, usage_count DESC
                LIMIT 6
            `, [category]);
            
            res.status(200).json({
                success: true,
                data: replies,
                message: 'Quick replies retrieved successfully'
            });
            
        } catch (error) {
            console.error('❌ Get quick replies error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get quick replies',
                error: error.message
            });
        }
    }
    
    // Search in chat history
    static async searchMessages(req, res) {
        try {
            const { query, session_id } = req.query;
            const { limit = 20 } = req.query;
            
            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }
            
            let conversationId = null;
            if (session_id) {
                const conversation = await ChatConversation.getBySessionId(session_id);
                conversationId = conversation ? conversation.id : null;
            }
            
            const messages = await ChatMessage.searchMessages(
                query,
                conversationId,
                parseInt(limit)
            );
            
            res.status(200).json({
                success: true,
                data: {
                    messages: messages,
                    query: query,
                    total_results: messages.length
                },
                message: 'Search completed successfully'
            });
            
        } catch (error) {
            console.error('❌ Search messages error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search messages',
                error: error.message
            });
        }
    }
    
    // Get chat statistics
    static async getChatStats(req, res) {
        try {
            const { days = 7 } = req.query;
            
            const conversationStats = await ChatConversation.getStatistics(parseInt(days));
            const sessionStats = await ChatSession.getSessionStats(parseInt(days));
            
            res.status(200).json({
                success: true,
                data: {
                    conversations: conversationStats,
                    sessions: sessionStats,
                    period_days: parseInt(days)
                },
                message: 'Chat statistics retrieved successfully'
            });
            
        } catch (error) {
            console.error('❌ Get stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get chat statistics',
                error: error.message
            });
        }
    }
    
    // Health check
    static async healthCheck(req, res) {
        try {
            const db = require('../config/database');
            
            // Check database connection
            await db.execute('SELECT 1');
            
            // Check tables exist
            const [tables] = await db.execute(`
                SELECT TABLE_NAME FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'chat_%'
            `);
            
            // Get basic stats
            const [activeConversations] = await db.execute(`
                SELECT COUNT(*) as count FROM chat_conversations WHERE status = 'active'
            `);
            
            const [totalMessages] = await db.execute(`
                SELECT COUNT(*) as count FROM chat_messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `);
            
            res.status(200).json({
                success: true,
                data: {
                    status: 'healthy',
                    database: 'connected',
                    tables_count: tables.length,
                    active_conversations: activeConversations[0].count,
                    messages_24h: totalMessages[0].count,
                    timestamp: new Date().toISOString()
                },
                message: 'AI Chatbot system is healthy'
            });
            
        } catch (error) {
            console.error('❌ Health check error:', error);
            res.status(500).json({
                success: false,
                message: 'System health check failed',
                error: error.message
            });
        }
    }
}

module.exports = ChatController;