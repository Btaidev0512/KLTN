// 🔑 CHAT SESSION MODEL
// Manages chat sessions and context

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class ChatSession {
    
    // Create new session
    static async createSession(userData = {}) {
        try {
            const sessionId = uuidv4();
            const { user_id, ip_address, user_agent, referrer_url, context = {}, preferences = {} } = userData;
            
            const [result] = await db.execute(`
                INSERT INTO chat_sessions 
                (session_id, user_id, conversation_context, user_preferences, 
                 ip_address, user_agent, referrer_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                sessionId,
                user_id || null,
                JSON.stringify(context),
                JSON.stringify(preferences),
                ip_address || null,
                user_agent || null,
                referrer_url || null
            ]);
            
            console.log(`✅ Session created: ${sessionId}`);
            return {
                session_id: sessionId,
                id: result.insertId
            };
            
        } catch (error) {
            console.error('❌ Error creating session:', error);
            throw new Error('Failed to create session');
        }
    }
    
    // Get session by ID
    static async getSession(sessionId) {
        try {
            const [sessions] = await db.execute(`
                SELECT * FROM chat_sessions WHERE session_id = ?
            `, [sessionId]);
            
            if (sessions.length === 0) {
                return null;
            }
            
            const session = sessions[0];
            return {
                ...session,
                conversation_context: session.conversation_context ? JSON.parse(session.conversation_context) : {},
                user_preferences: session.user_preferences ? JSON.parse(session.user_preferences) : {}
            };
            
        } catch (error) {
            console.error('❌ Error getting session:', error);
            throw new Error('Failed to get session');
        }
    }
    
    // Update session activity
    static async updateActivity(sessionId) {
        try {
            await db.execute(`
                UPDATE chat_sessions 
                SET last_activity = NOW()
                WHERE session_id = ?
            `, [sessionId]);
            
        } catch (error) {
            console.error('❌ Error updating session activity:', error);
        }
    }
    
    // Update conversation context
    static async updateContext(sessionId, context) {
        try {
            await db.execute(`
                UPDATE chat_sessions 
                SET conversation_context = ?, last_activity = NOW()
                WHERE session_id = ?
            `, [JSON.stringify(context), sessionId]);
            
            console.log(`✅ Context updated for session: ${sessionId}`);
            return true;
        } catch (error) {
            console.error('❌ Error updating context:', error);
            throw new Error('Failed to update context');
        }
    }
    
    // Update user preferences
    static async updatePreferences(sessionId, preferences) {
        try {
            await db.execute(`
                UPDATE chat_sessions 
                SET user_preferences = ?, last_activity = NOW()
                WHERE session_id = ?
            `, [JSON.stringify(preferences), sessionId]);
            
            console.log(`✅ Preferences updated for session: ${sessionId}`);
            return true;
        } catch (error) {
            console.error('❌ Error updating preferences:', error);
            throw new Error('Failed to update preferences');
        }
    }
    
    // Add to context
    static async addToContext(sessionId, key, value) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            
            const context = session.conversation_context || {};
            context[key] = value;
            
            await this.updateContext(sessionId, context);
            return true;
        } catch (error) {
            console.error('❌ Error adding to context:', error);
            throw new Error('Failed to add to context');
        }
    }
    
    // Get context value
    static async getContextValue(sessionId, key) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                return null;
            }
            
            const context = session.conversation_context || {};
            return context[key] || null;
        } catch (error) {
            console.error('❌ Error getting context value:', error);
            return null;
        }
    }
    
    // Close session
    static async closeSession(sessionId) {
        try {
            // Calculate session duration
            const [sessionData] = await db.execute(`
                SELECT created_at FROM chat_sessions WHERE session_id = ?
            `, [sessionId]);
            
            if (sessionData.length > 0) {
                const startTime = new Date(sessionData[0].created_at);
                const endTime = new Date();
                const durationSeconds = Math.floor((endTime - startTime) / 1000);
                
                await db.execute(`
                    UPDATE chat_sessions 
                    SET is_active = FALSE, session_duration = ?
                    WHERE session_id = ?
                `, [durationSeconds, sessionId]);
            }
            
            console.log(`✅ Session closed: ${sessionId}`);
            return true;
        } catch (error) {
            console.error('❌ Error closing session:', error);
            throw new Error('Failed to close session');
        }
    }
    
    // Get active sessions
    static async getActiveSessions(limit = 50) {
        try {
            const [sessions] = await db.execute(`
                SELECT s.*, c.status as conversation_status
                FROM chat_sessions s
                LEFT JOIN chat_conversations c ON s.session_id = c.session_id
                WHERE s.is_active = TRUE
                ORDER BY s.last_activity DESC
                LIMIT ?
            `, [limit]);
            
            return sessions.map(session => ({
                ...session,
                conversation_context: session.conversation_context ? JSON.parse(session.conversation_context) : {},
                user_preferences: session.user_preferences ? JSON.parse(session.user_preferences) : {}
            }));
            
        } catch (error) {
            console.error('❌ Error getting active sessions:', error);
            throw new Error('Failed to get active sessions');
        }
    }
    
    // Cleanup old sessions
    static async cleanupOldSessions(hoursOld = 24) {
        try {
            const [result] = await db.execute(`
                UPDATE chat_sessions 
                SET is_active = FALSE
                WHERE last_activity < DATE_SUB(NOW(), INTERVAL ? HOUR)
                AND is_active = TRUE
            `, [hoursOld]);
            
            console.log(`✅ Cleaned up ${result.affectedRows} old sessions`);
            return result.affectedRows;
        } catch (error) {
            console.error('❌ Error cleaning up sessions:', error);
            throw new Error('Failed to cleanup old sessions');
        }
    }
    
    // Get session statistics
    static async getSessionStats(days = 7) {
        try {
            const [stats] = await db.execute(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as total_sessions,
                    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_sessions,
                    AVG(session_duration) as avg_duration,
                    AVG(TIMESTAMPDIFF(SECOND, created_at, last_activity)) as avg_session_length
                FROM chat_sessions
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `, [days]);
            
            return stats;
        } catch (error) {
            console.error('❌ Error getting session stats:', error);
            throw new Error('Failed to get session statistics');
        }
    }
    
    // Set user for session
    static async setUser(sessionId, userId) {
        try {
            await db.execute(`
                UPDATE chat_sessions 
                SET user_id = ?, last_activity = NOW()
                WHERE session_id = ?
            `, [userId, sessionId]);
            
            console.log(`✅ User ${userId} set for session: ${sessionId}`);
            return true;
        } catch (error) {
            console.error('❌ Error setting user for session:', error);
            throw new Error('Failed to set user for session');
        }
    }
    
    // Get user sessions
    static async getUserSessions(userId, limit = 10) {
        try {
            const [sessions] = await db.execute(`
                SELECT s.*, c.status as conversation_status, c.total_messages
                FROM chat_sessions s
                LEFT JOIN chat_conversations c ON s.session_id = c.session_id
                WHERE s.user_id = ?
                ORDER BY s.created_at DESC
                LIMIT ?
            `, [userId, limit]);
            
            return sessions.map(session => ({
                ...session,
                conversation_context: session.conversation_context ? JSON.parse(session.conversation_context) : {},
                user_preferences: session.user_preferences ? JSON.parse(session.user_preferences) : {}
            }));
            
        } catch (error) {
            console.error('❌ Error getting user sessions:', error);
            throw new Error('Failed to get user sessions');
        }
    }
}

module.exports = ChatSession;