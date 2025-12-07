// SIMPLIFIED AI PROCESSOR FOR DEBUGGING
const db = require('../config/database');

class SimpleAIProcessor {
    
    static async processMessage(conversationId, userMessage, sessionId) {
        try {
            console.log(`🤖 SimpleAI processing: "${userMessage}"`);
            
            // Simple intent detection
            const intent = await this.detectIntent(userMessage);
            console.log(`🎯 Intent: ${intent.name} (confidence: ${intent.confidence})`);
            
            // Generate response based on intent
            let responseText = intent.response;
            
            // Add some personalization
            if (intent.name === 'greeting') {
                responseText = "Xin chào! Tôi là trợ lý AI của shop. Tôi có thể giúp gì cho bạn? 😊";
            } else if (intent.name === 'product_search') {
                responseText = "Tôi sẽ giúp bạn tìm sản phẩm! Bạn đang tìm loại sản phẩm nào? Có thể cho tôi biết thêm chi tiết không? 🛍️";
            } else if (intent.name === 'order_tracking') {
                responseText = "Tôi sẽ giúp bạn tra cứu đơn hàng. Vui lòng cung cấp mã đơn hàng của bạn. 📦";
            } else if (intent.name === 'account_help') {
                responseText = "Tôi có thể hỗ trợ bạn về các vấn đề tài khoản. Bạn gặp vấn đề gì? 👤";
            } else if (intent.name === 'payment_support') {
                responseText = "Tôi sẽ giúp bạn về các vấn đề thanh toán. Bạn có câu hỏi gì về thanh toán? 💳";
            } else if (intent.name === 'farewell') {
                responseText = "Cảm ơn bạn đã liên hệ với chúng tôi! Chúc bạn một ngày tốt lành! 👋";
            } else {
                responseText = "Tôi có thể giúp gì cho bạn? Hãy cho tôi biết chi tiết hơn nhé! 😊";
            }
            
            console.log(`💬 Generated response: ${responseText.substring(0, 50)}...`);
            
            const startTime = Date.now();
            
            // Save to database using simple query
            console.log('💾 Saving AI response to database...');
            const [result] = await db.execute(`
                INSERT INTO chat_messages (
                    conversation_id, sender_type, message_text, 
                    message_type, ai_confidence, intent_detected, 
                    response_time_ms, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                conversationId,
                'ai',
                responseText,
                'text',
                intent.confidence,
                intent.name,
                Date.now() - startTime
            ]);
            
            console.log(`✅ AI message saved with ID: ${result.insertId}`);
            
            const responseData = {
                id: result.insertId,
                conversation_id: conversationId,
                sender_type: 'ai',
                message_text: responseText,
                message_type: 'text',
                ai_confidence: intent.confidence,
                intent_detected: intent.name,
                response_time_ms: Date.now() - startTime,
                created_at: new Date().toISOString()
            };
            
            console.log(`✅ SimpleAI response generated successfully`);
            
            return {
                message: responseData,
                intent: intent.name,
                confidence: intent.confidence,
                responseTime: Date.now() - startTime
            };
            
        } catch (error) {
            console.error('❌ SimpleAI error:', error);
            
            // Simple fallback
            const fallbackText = "Xin lỗi, tôi gặp chút vấn đề. Bạn có thể thử lại không? 😅";
            
            try {
                const [result] = await db.execute(`
                    INSERT INTO chat_messages (
                        conversation_id, sender_type, message_text, 
                        message_type, created_at
                    ) VALUES (?, ?, ?, ?, NOW())
                `, [conversationId, 'ai', fallbackText, 'text']);
                
                return {
                    message: {
                        id: result.insertId,
                        conversation_id: conversationId,
                        sender_type: 'ai',
                        message_text: fallbackText,
                        message_type: 'text',
                        created_at: new Date().toISOString()
                    },
                    intent: 'error',
                    confidence: 0,
                    responseTime: 0,
                    error: true
                };
            } catch (dbError) {
                console.error('❌ Database fallback error:', dbError);
                throw error; // Re-throw original error if DB fails
            }
        }
    }
    
    static async detectIntent(userMessage) {
        try {
            const message = userMessage.toLowerCase().trim();
            
            // Get intents from database
            const [intents] = await db.execute(`
                SELECT intent_name, keywords, response_template, confidence_threshold
                FROM ai_intents 
                WHERE is_active = 1
                ORDER BY priority_level ASC
            `);
            
            let bestMatch = {
                name: 'general',
                confidence: 0,
                response: 'Tôi có thể giúp gì cho bạn?'
            };
            
            // Simple keyword matching
            for (const intent of intents) {
                const keywords = intent.keywords.toLowerCase().split(',').map(k => k.trim());
                let matchCount = 0;
                
                for (const keyword of keywords) {
                    if (message.includes(keyword)) {
                        matchCount++;
                    }
                }
                
                const confidence = matchCount / keywords.length;
                
                // Lower threshold for better matching
                if (confidence > bestMatch.confidence && confidence >= 0.1) {
                    bestMatch = {
                        name: intent.intent_name,
                        confidence: parseFloat(confidence.toFixed(2)),
                        response: intent.response_template
                    };
                }
            }
            
            console.log(`🔍 Intent detection: "${userMessage}" → ${bestMatch.name} (${bestMatch.confidence})`);
            
            return bestMatch;
            
        } catch (error) {
            console.error('❌ Intent detection error:', error);
            return {
                name: 'error',
                confidence: 0,
                response: 'Xin lỗi, tôi không hiểu câu hỏi của bạn.'
            };
        }
    }
}

module.exports = SimpleAIProcessor;