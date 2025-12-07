// 🌐 WEBSOCKET SERVICE
// Real-time communication for AI Chat Box

const socketIo = require('socket.io');
const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const ChatSession = require('../models/ChatSession');
const AIProcessor = require('../models/AIProcessor');

class WebSocketService {
    static io = null;
    static connectedUsers = new Map(); // sessionId -> socket mapping
    
    // Initialize WebSocket server
    static initialize(server) {
        console.log('🌐 Initializing WebSocket service...');
        
        this.io = socketIo(server, {
            cors: {
                origin: process.env.CORS_ORIGINS?.split(',') || ["http://localhost:3000", "http://localhost:3001"],
                methods: ["GET", "POST"]
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });
        
        // Handle connections
        this.io.on('connection', (socket) => {
            console.log(`✅ User connected: ${socket.id}`);
            
            // Handle join chat room
            socket.on('join_chat', async (data) => {
                await this.handleJoinChat(socket, data);
            });
            
            // Handle send message
            socket.on('send_message', async (data) => {
                await this.handleSendMessage(socket, data);
            });
            
            // Handle typing indicators
            socket.on('typing_start', (data) => {
                this.handleTypingStart(socket, data);
            });
            
            socket.on('typing_stop', (data) => {
                this.handleTypingStop(socket, data);
            });
            
            // Handle disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
            
            // Handle errors
            socket.on('error', (error) => {
                console.error(`❌ Socket error for ${socket.id}:`, error);
            });
        });
        
        console.log('✅ WebSocket service initialized successfully');
        return this.io;
    }
    
    // Handle user joining chat room
    static async handleJoinChat(socket, data) {
        try {
            const { session_id, user_info } = data;
            
            if (!session_id) {
                socket.emit('error', { message: 'Session ID is required' });
                return;
            }
            
            console.log(`💬 User ${socket.id} joining chat: ${session_id}`);
            
            // Join socket room
            socket.join(session_id);
            socket.session_id = session_id;
            
            // Store user connection
            this.connectedUsers.set(session_id, {
                socket_id: socket.id,
                socket: socket,
                joined_at: new Date(),
                user_info: user_info || {}
            });
            
            // Get or create conversation
            let conversation = await ChatConversation.getBySessionId(session_id);
            if (!conversation && user_info) {
                const newConversation = await ChatConversation.startConversation({
                    ...user_info,
                    user_ip: socket.handshake.address,
                    user_agent: socket.handshake.headers['user-agent']
                });
                conversation = await ChatConversation.getBySessionId(newConversation.session_id);
            }
            
            if (conversation) {
                // Get recent messages
                const messages = await ChatMessage.getConversationMessages(conversation.id, 20);
                
                // Send chat history
                socket.emit('chat_joined', {
                    session_id: session_id,
                    conversation_id: conversation.id,
                    messages: messages,
                    status: 'connected'
                });
                
                // Update session activity
                await ChatSession.updateActivity(session_id);
            }
            
            console.log(`✅ User ${socket.id} joined chat successfully`);
            
        } catch (error) {
            console.error('❌ Join chat error:', error);
            socket.emit('error', { 
                message: 'Failed to join chat', 
                error: error.message 
            });
        }
    }
    
    // Handle sending message
    static async handleSendMessage(socket, data) {
        try {
            const { session_id, message, message_type = 'text' } = data;
            
            if (!session_id || !message) {
                socket.emit('error', { message: 'Session ID and message are required' });
                return;
            }
            
            console.log(`💬 Message from ${socket.id}: "${message.substring(0, 50)}..."`);            
            // Get conversation
            const conversation = await ChatConversation.getBySessionId(session_id);
            if (!conversation) {
                socket.emit('error', { message: 'Chat session not found' });
                return;
            }
            
            // Add user message
            const userMessage = await ChatMessage.addMessage(
                conversation.id,
                'user',
                message,
                message_type
            );
            
            // Broadcast user message to room
            this.io.to(session_id).emit('new_message', {
                message: userMessage,
                sender: 'user',
                timestamp: new Date().toISOString()
            });
            
            // Show AI typing indicator
            socket.emit('ai_typing', { session_id });
            
            try {
                // Process with AI
                const aiResponse = await AIProcessor.processMessage(
                    conversation.id,
                    message,
                    session_id
                );
                
                // Stop typing indicator and send AI response
                socket.emit('ai_stop_typing', { session_id });
                
                this.io.to(session_id).emit('new_message', {
                    message: aiResponse.message,
                    sender: 'ai',
                    intent: aiResponse.intent,
                    confidence: aiResponse.confidence,
                    response_time: aiResponse.responseTime,
                    timestamp: new Date().toISOString()
                });
                
                // Update session activity
                await ChatSession.updateActivity(session_id);
                
                console.log(`✅ AI response sent to ${session_id}`);
                
            } catch (aiError) {
                console.error('❌ AI processing error:', aiError);
                
                // Send fallback response
                socket.emit('ai_stop_typing', { session_id });
                
                const fallbackMessage = await ChatMessage.addMessage(
                    conversation.id,
                    'ai',
                    'Xin lỗi, tôi gặp chút vấn đề. Bạn có thể thử lại câu hỏi không? 😔',
                    'text'
                );
                
                this.io.to(session_id).emit('new_message', {
                    message: fallbackMessage,
                    sender: 'ai',
                    error: true,
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            console.error('❌ Send message error:', error);
            socket.emit('error', { 
                message: 'Failed to send message', 
                error: error.message 
            });
        }
    }
    
    // Handle typing start
    static handleTypingStart(socket, data) {
        const { session_id } = data;
        if (session_id) {
            socket.to(session_id).emit('user_typing', { 
                session_id, 
                user_id: socket.id 
            });
        }
    }
    
    // Handle typing stop
    static handleTypingStop(socket, data) {
        const { session_id } = data;
        if (session_id) {
            socket.to(session_id).emit('user_stop_typing', { 
                session_id, 
                user_id: socket.id 
            });
        }
    }
    
    // Handle disconnect
    static handleDisconnect(socket) {
        console.log(`🖼️ User disconnected: ${socket.id}`);
        
        // Remove from connected users
        for (const [session_id, userData] of this.connectedUsers.entries()) {
            if (userData.socket_id === socket.id) {
                this.connectedUsers.delete(session_id);
                console.log(`🖼️ Removed user from session: ${session_id}`);
                break;
            }
        }
    }
    
    // Send message to specific session
    static sendToSession(session_id, event, data) {
        if (this.io) {
            this.io.to(session_id).emit(event, data);
            return true;
        }
        return false;
    }
    
    // Broadcast to all connected users
    static broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
            return true;
        }
        return false;
    }
    
    // Get connected users count
    static getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
    
    // Get connected users info
    static getConnectedUsers() {
        const users = [];
        for (const [session_id, userData] of this.connectedUsers.entries()) {
            users.push({
                session_id,
                socket_id: userData.socket_id,
                joined_at: userData.joined_at,
                user_info: userData.user_info
            });
        }
        return users;
    }
    
    // Send notification to admin about new chat
    static notifyAdminNewChat(conversationData) {
        if (this.io) {
            this.io.emit('admin_new_chat', {
                conversation: conversationData,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Send typing indicator for AI
    static sendAITyping(session_id, isTyping = true) {
        if (this.io) {
            const event = isTyping ? 'ai_typing' : 'ai_stop_typing';
            this.io.to(session_id).emit(event, { session_id });
        }
    }
    
    // Health check for WebSocket service
    static getServiceStatus() {
        return {
            initialized: this.io !== null,
            connected_users: this.getConnectedUsersCount(),
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    }
}

module.exports = WebSocketService;