-- 🤖 AI CHATBOT DATABASE SCHEMA - PHASE 1
-- Created: 2025-09-27
-- Purpose: Complete database setup for AI Chat Box Support System

-- =================================================================
-- CHAT CONVERSATIONS TABLE - Lưu cuộc hội thoại
-- =================================================================
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NULL,
    user_email VARCHAR(255) NULL,
    user_name VARCHAR(255) NULL,
    user_ip VARCHAR(45) NULL,
    user_agent TEXT NULL,
    status ENUM('active', 'closed', 'escalated', 'abandoned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NULL,
    total_messages INT DEFAULT 0,
    
    -- Indexes for performance
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_user_email (user_email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_last_message_at (last_message_at)
);

-- =================================================================
-- CHAT MESSAGES TABLE - Chi tiết tin nhắn
-- =================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender_type ENUM('user', 'ai', 'admin', 'system') NOT NULL,
    message_text TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'quick_reply', 'product_card', 'order_info', 'system_info') DEFAULT 'text',
    metadata JSON NULL, -- Store rich content, attachments, etc.
    ai_confidence DECIMAL(3,2) NULL, -- AI response confidence score
    intent_detected VARCHAR(100) NULL, -- Detected user intent
    response_time_ms INT NULL, -- AI response generation time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL,
    
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_type (sender_type),
    INDEX idx_message_type (message_type),
    INDEX idx_created_at (created_at),
    INDEX idx_intent_detected (intent_detected),
    
    -- Full-text search on messages
    FULLTEXT KEY idx_message_fulltext (message_text)
);

-- =================================================================
-- AI INTENTS TABLE - AI training data và intent recognition
-- =================================================================
CREATE TABLE IF NOT EXISTS ai_intents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    intent_name VARCHAR(100) NOT NULL UNIQUE,
    category ENUM('general', 'product', 'order', 'account', 'technical', 'escalation') DEFAULT 'general',
    keywords TEXT NOT NULL, -- Comma-separated keywords
    response_template TEXT NOT NULL,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    priority_level INT DEFAULT 1, -- 1=highest, 5=lowest
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0, -- Track intent usage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_intent_name (intent_name),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    INDEX idx_priority_level (priority_level),
    
    -- Full-text search on keywords
    FULLTEXT KEY idx_keywords_fulltext (keywords)
);

-- =================================================================
-- CHAT SESSIONS TABLE - Session management và context
-- =================================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NULL,
    conversation_context JSON NULL, -- Store conversation context
    user_preferences JSON NULL, -- Store user preferences
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_duration INT DEFAULT 0, -- seconds
    is_active BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    referrer_url TEXT NULL,
    
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity),
    INDEX idx_is_active (is_active)
);

-- =================================================================
-- CHAT ANALYTICS TABLE - Thống kê và phân tích
-- =================================================================
CREATE TABLE IF NOT EXISTS chat_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    total_messages INT DEFAULT 0,
    user_messages INT DEFAULT 0,
    ai_messages INT DEFAULT 0,
    user_satisfaction ENUM('very_poor', 'poor', 'average', 'good', 'excellent') NULL,
    resolution_status ENUM('resolved', 'unresolved', 'escalated', 'abandoned') DEFAULT 'unresolved',
    session_duration INT NULL, -- seconds
    first_response_time INT NULL, -- seconds to first AI response
    avg_response_time INT NULL, -- average AI response time
    intent_accuracy DECIMAL(3,2) NULL, -- How accurate were intent detections
    escalated_to_human BOOLEAN DEFAULT FALSE,
    escalation_reason TEXT NULL,
    feedback_rating INT NULL, -- 1-5 rating
    feedback_comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_session_id (session_id),
    INDEX idx_resolution_status (resolution_status),
    INDEX idx_user_satisfaction (user_satisfaction),
    INDEX idx_created_at (created_at),
    INDEX idx_escalated_to_human (escalated_to_human)
);

-- =================================================================
-- CHAT QUICK REPLIES TABLE - Pre-defined quick responses
-- =================================================================
CREATE TABLE IF NOT EXISTS chat_quick_replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category ENUM('greeting', 'product', 'order', 'account', 'support', 'farewell') DEFAULT 'support',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order)
);

-- =================================================================
-- ADMIN CHAT AGENTS TABLE - Human agents for escalation
-- =================================================================
CREATE TABLE IF NOT EXISTS chat_agents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL, -- Reference to users table
    agent_name VARCHAR(255) NOT NULL,
    agent_email VARCHAR(255) NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    current_chat_count INT DEFAULT 0,
    max_concurrent_chats INT DEFAULT 5,
    specialization ENUM('general', 'technical', 'sales', 'billing') DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_online (is_online),
    INDEX idx_is_active (is_active),
    INDEX idx_specialization (specialization)
);

-- =================================================================
-- CHAT FILES TABLE - File attachments in chat
-- =================================================================
CREATE TABLE IF NOT EXISTS chat_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INT NOT NULL, -- bytes
    mime_type VARCHAR(100) NOT NULL,
    upload_status ENUM('uploading', 'completed', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    INDEX idx_message_id (message_id),
    INDEX idx_mime_type (mime_type),
    INDEX idx_created_at (created_at)
);

-- =================================================================
-- INSERT SAMPLE DATA - AI Intents và Quick Replies
-- =================================================================

-- Sample AI Intents
INSERT INTO ai_intents (intent_name, category, keywords, response_template, priority_level) VALUES
('greeting', 'general', 'xin chào,hello,hi,chào bạn,chào shop', 'Xin chào! Tôi là trợ lý AI của shop. Tôi có thể giúp gì cho bạn hôm nay? 😊', 1),
('product_search', 'product', 'tìm sản phẩm,sản phẩm,mua,tìm,search,product', 'Tôi sẽ giúp bạn tìm sản phẩm. Bạn có thể cho tôi biết loại sản phẩm nào bạn đang tìm kiếm không?', 1),
('order_tracking', 'order', 'đơn hàng,order,tracking,tra cứu,kiểm tra đơn', 'Tôi sẽ giúp bạn tra cứu thông tin đơn hàng. Vui lòng cung cấp mã đơn hàng hoặc email đặt hàng.', 1),
('account_help', 'account', 'tài khoản,account,đăng nhập,đăng ký,quên mật khẩu', 'Tôi có thể hỗ trợ bạn về các vấn đề tài khoản. Bạn gặp vấn đề gì với tài khoản của mình?', 2),
('payment_support', 'order', 'thanh toán,payment,tiền,phí ship,giá', 'Tôi sẽ giúp bạn về các vấn đề thanh toán. Bạn có câu hỏi gì về phương thức thanh toán hay giá cả?', 2),
('technical_issue', 'technical', 'lỗi,bug,không hoạt động,technical,website không load', 'Tôi hiểu bạn đang gặp vấn đề kỹ thuật. Để được hỗ trợ tốt nhất, tôi sẽ chuyển bạn đến nhân viên kỹ thuật.', 3),
('escalate_human', 'escalation', 'nói chuyện với người thật,nhân viên,human,admin,quản lý', 'Tôi sẽ chuyển cuộc hội thoại này đến nhân viên hỗ trợ của chúng tôi. Vui lòng chờ trong giây lát.', 1),
('farewell', 'general', 'tạm biệt,bye,thanks,cảm ơn,goodbye', 'Cảm ơn bạn đã liên hệ với chúng tôi! Chúc bạn một ngày tốt lành! 😊', 5);

-- Sample Quick Replies
INSERT INTO chat_quick_replies (title, message, category, display_order) VALUES
('🔍 Tìm sản phẩm', 'Tôi muốn tìm sản phẩm', 'product', 1),
('📦 Tra cứu đơn hàng', 'Tôi muốn kiểm tra đơn hàng của mình', 'order', 2),
('💳 Hỗ trợ thanh toán', 'Tôi cần hỗ trợ về thanh toán', 'order', 3),
('👤 Vấn đề tài khoản', 'Tôi cần hỗ trợ về tài khoản', 'account', 4),
('🎧 Nói chuyện với nhân viên', 'Tôi muốn nói chuyện với nhân viên hỗ trợ', 'support', 5),
('💬 Khác', 'Tôi có vấn đề khác', 'support', 6);

-- =================================================================
-- PERFORMANCE OPTIMIZATION
-- =================================================================

-- Create composite indexes for common queries
CREATE INDEX idx_conv_user_status ON chat_conversations(user_id, status, created_at);
CREATE INDEX idx_msg_conv_sender ON chat_messages(conversation_id, sender_type, created_at);
CREATE INDEX idx_session_user_active ON chat_sessions(user_id, is_active, last_activity);
CREATE INDEX idx_analytics_date_status ON chat_analytics(created_at, resolution_status);

-- =================================================================
-- VIEWS FOR EASY QUERYING
-- =================================================================

-- Active conversations view
CREATE OR REPLACE VIEW active_conversations AS
SELECT 
    c.id,
    c.session_id,
    c.user_id,
    c.user_email,
    c.user_name,
    c.status,
    c.created_at,
    c.last_message_at,
    c.total_messages,
    TIMESTAMPDIFF(MINUTE, c.created_at, NOW()) as duration_minutes
FROM chat_conversations c
WHERE c.status = 'active'
ORDER BY c.last_message_at DESC;

-- Chat statistics view
CREATE OR REPLACE VIEW chat_statistics AS
SELECT 
    DATE(c.created_at) as chat_date,
    COUNT(*) as total_conversations,
    COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_conversations,
    COUNT(CASE WHEN c.status = 'closed' THEN 1 END) as closed_conversations,
    COUNT(CASE WHEN c.status = 'escalated' THEN 1 END) as escalated_conversations,
    AVG(a.session_duration) as avg_session_duration,
    AVG(a.total_messages) as avg_messages_per_session
FROM chat_conversations c
LEFT JOIN chat_analytics a ON c.id = a.conversation_id
GROUP BY DATE(c.created_at)
ORDER BY chat_date DESC;

-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================
SELECT '✅ AI Chatbot database schema created successfully!' as status;
SELECT 'Tables created: 8 main tables + 2 views' as info;
SELECT 'Sample data inserted: AI intents and quick replies ready!' as data_status;