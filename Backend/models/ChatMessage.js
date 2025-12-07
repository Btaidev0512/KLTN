// 💬 CHAT MESSAGE MODEL
// Handles chat messages between users and AI

const db = require('../config/database');
const moment = require('moment');
const ChatConversation = require('./ChatConversation');

class ChatMessage {
    
    // Add new message to conversation
    static async addMessage(conversationId, senderType, messageText, messageType = 'text', metadata = null, aiData = {}) {
        try {
            const { confidence, intent, responseTime } = aiData;
            
            const [result] = await db.execute(`
                INSERT INTO chat_messages 
                (conversation_id, sender_type, message_text, message_type, metadata, 
                 ai_confidence, intent_detected, response_time_ms)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                conversationId,
                senderType,
                messageText,
                messageType,
                metadata ? JSON.stringify(metadata) : null,
                confidence || null,
                intent || null,
                responseTime || null
            ]);
            
            const messageId = result.insertId;
            
            // Update conversation timestamps and counters
            await ChatConversation.updateLastMessage(conversationId);
            await ChatConversation.incrementMessageCount(conversationId);
            
            console.log(`✅ Message added: ${messageId} (${senderType})`);
            return {
                id: messageId,
                conversation_id: conversationId,
                sender_type: senderType,
                message_text: messageText,
                message_type: messageType,
                metadata: metadata,
                created_at: new Date()
            };
            
        } catch (error) {
            console.error('❌ Error adding message:', error);
            throw new Error('Failed to add message');
        }
    }
    
    // Get conversation messages
    static async getConversationMessages(conversationId, limit = 100, offset = 0) {
        try {
            const [messages] = await db.execute(`
                SELECT m.*, 
                       DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') as formatted_time
                FROM chat_messages m
                WHERE m.conversation_id = ?
                ORDER BY m.created_at ASC
                LIMIT ? OFFSET ?
            `, [conversationId, limit, offset]);
            
            // Parse metadata for messages that have it
            return messages.map(msg => ({
                ...msg,
                metadata: msg.metadata ? JSON.parse(msg.metadata) : null
            }));
            
        } catch (error) {
            console.error('❌ Error getting messages:', error);
            throw new Error('Failed to get conversation messages');
        }
    }
    
    // Get messages by session ID
    static async getMessagesBySessionId(sessionId, limit = 100) {
        try {
            const [messages] = await db.execute(`
                SELECT m.*, c.session_id,
                       DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') as formatted_time
                FROM chat_messages m
                JOIN chat_conversations c ON m.conversation_id = c.id
                WHERE c.session_id = ?
                ORDER BY m.created_at ASC
                LIMIT ?
            `, [sessionId, limit]);
            
            return messages.map(msg => ({
                ...msg,
                metadata: msg.metadata ? JSON.parse(msg.metadata) : null
            }));
            
        } catch (error) {
            console.error('❌ Error getting messages by session:', error);
            throw new Error('Failed to get messages by session ID');
        }
    }
    
    // Update message
    static async updateMessage(messageId, newText, isEdited = true) {
        try {
            await db.execute(`
                UPDATE chat_messages 
                SET message_text = ?, is_edited = ?, edited_at = NOW()
                WHERE id = ?
            `, [newText, isEdited, messageId]);
            
            console.log(`✅ Message ${messageId} updated`);
            return true;
        } catch (error) {
            console.error('❌ Error updating message:', error);
            throw new Error('Failed to update message');
        }
    }
    
    // Delete message
    static async deleteMessage(messageId) {
        try {
            await db.execute(`
                DELETE FROM chat_messages WHERE id = ?
            `, [messageId]);
            
            console.log(`✅ Message ${messageId} deleted`);
            return true;
        } catch (error) {
            console.error('❌ Error deleting message:', error);
            throw new Error('Failed to delete message');
        }
    }
    
    // Search messages
    static async searchMessages(query, conversationId = null, limit = 50) {
        try {
            let sql = `
                SELECT m.*, c.session_id,
                       DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') as formatted_time,
                       MATCH(m.message_text) AGAINST(? IN BOOLEAN MODE) as relevance
                FROM chat_messages m
                JOIN chat_conversations c ON m.conversation_id = c.id
                WHERE MATCH(m.message_text) AGAINST(? IN BOOLEAN MODE)
            `;
            
            const params = [query, query];
            
            if (conversationId) {
                sql += ' AND m.conversation_id = ?';
                params.push(conversationId);
            }
            
            sql += ' ORDER BY relevance DESC, m.created_at DESC LIMIT ?';
            params.push(limit);
            
            const [messages] = await db.execute(sql, params);
            
            return messages.map(msg => ({
                ...msg,
                metadata: msg.metadata ? JSON.parse(msg.metadata) : null
            }));
            
        } catch (error) {
            console.error('❌ Error searching messages:', error);
            throw new Error('Failed to search messages');
        }
    }
    
    // Get recent messages for context
    static async getRecentContext(conversationId, limit = 5) {
        try {
            const [messages] = await db.execute(`
                SELECT sender_type, message_text, created_at
                FROM chat_messages 
                WHERE conversation_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [conversationId, limit]);
            
            // Reverse to get chronological order
            return messages.reverse();
            
        } catch (error) {
            console.error('❌ Error getting recent context:', error);
            return [];
        }
    }
    
    // Get message statistics
    static async getMessageStats(conversationId) {
        try {
            const [stats] = await db.execute(`
                SELECT 
                    COUNT(*) as total_messages,
                    COUNT(CASE WHEN sender_type = 'user' THEN 1 END) as user_messages,
                    COUNT(CASE WHEN sender_type = 'ai' THEN 1 END) as ai_messages,
                    COUNT(CASE WHEN sender_type = 'system' THEN 1 END) as system_messages,
                    AVG(CASE WHEN ai_confidence IS NOT NULL THEN ai_confidence END) as avg_ai_confidence,
                    AVG(CASE WHEN response_time_ms IS NOT NULL THEN response_time_ms END) as avg_response_time
                FROM chat_messages
                WHERE conversation_id = ?
            `, [conversationId]);
            
            return stats[0] || {};
        } catch (error) {
            console.error('❌ Error getting message stats:', error);
            throw new Error('Failed to get message statistics');
        }
    }
    
    // Add file attachment
    static async addFileAttachment(messageId, fileData) {
        try {
            const { originalName, storedName, filePath, fileSize, mimeType } = fileData;
            
            const [result] = await db.execute(`
                INSERT INTO chat_files 
                (message_id, original_filename, stored_filename, file_path, file_size, mime_type)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [messageId, originalName, storedName, filePath, fileSize, mimeType]);
            
            console.log(`✅ File attachment added: ${originalName}`);
            return result.insertId;
            
        } catch (error) {
            console.error('❌ Error adding file attachment:', error);
            throw new Error('Failed to add file attachment');
        }
    }
    
    // Get message attachments
    static async getMessageAttachments(messageId) {
        try {
            const [files] = await db.execute(`
                SELECT * FROM chat_files WHERE message_id = ?
            `, [messageId]);
            
            return files;
        } catch (error) {
            console.error('❌ Error getting attachments:', error);
            return [];
        }
    }
}

module.exports = ChatMessage;