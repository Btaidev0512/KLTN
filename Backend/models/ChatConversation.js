// 🤖 CHAT CONVERSATION MODEL
// Manages chat conversations with users

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class ChatConversation {
    
    // Start new conversation
    static async startConversation(userData = {}) {
        try {
            const sessionId = uuidv4();
            const { user_id, user_email, user_name, user_ip, user_agent } = userData;
            
            const [result] = await db.execute(`
                INSERT INTO chat_conversations 
                (session_id, user_id, user_email, user_name, user_ip, user_agent, last_message_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [sessionId, user_id || null, user_email || null, user_name || null, user_ip || null, user_agent || null]);
            
            const conversationId = result.insertId;
            
            // Create initial session
            await db.execute(`
                INSERT INTO chat_sessions (session_id, user_id, last_activity)
                VALUES (?, ?, NOW())
            `, [sessionId, user_id || null]);
            
            // Send welcome message
            await this.addSystemMessage(conversationId, 'Xin chào! Tôi là trợ lý AI của shop. Tôi có thể giúp gì cho bạn hôm nay? 😊');
            
            console.log(`✅ New conversation started: ${sessionId}`);
            return {
                conversation_id: conversationId,
                session_id: sessionId,
                status: 'active'
            };
            
        } catch (error) {
            console.error('❌ Error starting conversation:', error);
            throw new Error('Failed to start conversation');
        }
    }
    
    // Get conversation by session ID
    static async getBySessionId(sessionId) {
        try {
            const [conversations] = await db.execute(`
                SELECT * FROM chat_conversations WHERE session_id = ?
            `, [sessionId]);
            
            return conversations[0] || null;
        } catch (error) {
            console.error('❌ Error getting conversation:', error);
            throw new Error('Failed to get conversation');
        }
    }
    
    // Update conversation status
    static async updateStatus(conversationId, status) {
        try {
            await db.execute(`
                UPDATE chat_conversations 
                SET status = ?, updated_at = NOW()
                WHERE id = ?
            `, [status, conversationId]);
            
            console.log(`✅ Conversation ${conversationId} status updated to: ${status}`);
            return true;
        } catch (error) {
            console.error('❌ Error updating conversation status:', error);
            throw new Error('Failed to update conversation status');
        }
    }
    
    // Update last message timestamp
    static async updateLastMessage(conversationId) {
        try {
            await db.execute(`
                UPDATE chat_conversations 
                SET last_message_at = NOW(), updated_at = NOW()
                WHERE id = ?
            `, [conversationId]);
        } catch (error) {
            console.error('❌ Error updating last message time:', error);
        }
    }
    
    // Increment message count
    static async incrementMessageCount(conversationId) {
        try {
            await db.execute(`
                UPDATE chat_conversations 
                SET total_messages = total_messages + 1
                WHERE id = ?
            `, [conversationId]);
        } catch (error) {
            console.error('❌ Error incrementing message count:', error);
        }
    }
    
    // Add system message
    static async addSystemMessage(conversationId, message, messageType = 'text') {
        try {
            const [result] = await db.execute(`
                INSERT INTO chat_messages 
                (conversation_id, sender_type, message_text, message_type)
                VALUES (?, 'system', ?, ?)
            `, [conversationId, message, messageType]);
            
            await this.updateLastMessage(conversationId);
            await this.incrementMessageCount(conversationId);
            
            return result.insertId;
        } catch (error) {
            console.error('❌ Error adding system message:', error);
            throw new Error('Failed to add system message');
        }
    }
    
    // Get active conversations
    static async getActiveConversations(limit = 50) {
        try {
            const [conversations] = await db.execute(`
                SELECT c.*, 
                       COUNT(m.id) as message_count,
                       MAX(m.created_at) as last_message_time
                FROM chat_conversations c
                LEFT JOIN chat_messages m ON c.id = m.conversation_id
                WHERE c.status = 'active'
                GROUP BY c.id
                ORDER BY c.last_message_at DESC
                LIMIT ?
            `, [limit]);
            
            return conversations;
        } catch (error) {
            console.error('❌ Error getting active conversations:', error);
            throw new Error('Failed to get active conversations');
        }
    }
    
    // Close conversation
    static async closeConversation(conversationId, satisfaction = null) {
        try {
            // Update conversation status
            await this.updateStatus(conversationId, 'closed');
            
            // Update session
            const conversation = await db.execute(`
                SELECT session_id FROM chat_conversations WHERE id = ?
            `, [conversationId]);
            
            if (conversation[0]?.length > 0) {
                await db.execute(`
                    UPDATE chat_sessions 
                    SET is_active = FALSE
                    WHERE session_id = ?
                `, [conversation[0][0].session_id]);
            }
            
            // Create analytics record if doesn't exist
            const [existing] = await db.execute(`
                SELECT id FROM chat_analytics WHERE conversation_id = ?
            `, [conversationId]);
            
            if (existing.length === 0) {
                await this.createAnalytics(conversationId, satisfaction);
            }
            
            console.log(`✅ Conversation ${conversationId} closed successfully`);
            return true;
        } catch (error) {
            console.error('❌ Error closing conversation:', error);
            throw new Error('Failed to close conversation');
        }
    }
    
    // Create analytics record
    static async createAnalytics(conversationId, satisfaction = null) {
        try {
            // Get conversation details
            const [convData] = await db.execute(`
                SELECT c.session_id, c.created_at, c.total_messages,
                       COUNT(CASE WHEN m.sender_type = 'user' THEN 1 END) as user_messages,
                       COUNT(CASE WHEN m.sender_type = 'ai' THEN 1 END) as ai_messages,
                       TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) as duration
                FROM chat_conversations c
                LEFT JOIN chat_messages m ON c.id = m.conversation_id
                WHERE c.id = ?
                GROUP BY c.id
            `, [conversationId]);
            
            if (convData.length > 0) {
                const data = convData[0];
                
                await db.execute(`
                    INSERT INTO chat_analytics 
                    (conversation_id, session_id, total_messages, user_messages, ai_messages, 
                     session_duration, user_satisfaction, resolution_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'resolved')
                `, [
                    conversationId, 
                    data.session_id,
                    data.total_messages || 0,
                    data.user_messages || 0,
                    data.ai_messages || 0,
                    data.duration || 0,
                    satisfaction
                ]);
            }
        } catch (error) {
            console.error('❌ Error creating analytics:', error);
        }
    }
    
    // Get conversation statistics
    static async getStatistics(days = 7) {
        try {
            const [stats] = await db.execute(`
                SELECT 
                    COUNT(*) as total_conversations,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count,
                    COUNT(CASE WHEN status = 'escalated' THEN 1 END) as escalated_count,
                    AVG(total_messages) as avg_messages,
                    DATE(created_at) as date
                FROM chat_conversations
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `, [days]);
            
            return stats;
        } catch (error) {
            console.error('❌ Error getting statistics:', error);
            throw new Error('Failed to get conversation statistics');
        }
    }
}

module.exports = ChatConversation;