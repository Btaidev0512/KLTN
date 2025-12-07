// 🤖 AI PROCESSOR MODEL
// Handles AI logic, intent recognition, and response generation

const db = require('../config/database');
const OpenAI = require('openai');
const natural = require('natural');
const sentiment = require('sentiment');
const ChatMessage = require('./ChatMessage');
const ChatSession = require('./ChatSession');

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}) : null;

// Initialize NLP tools
const stemmer = natural.PorterStemmer;
const tokenizer = new natural.WordTokenizer();
const sentimentAnalyzer = new sentiment();

class AIProcessor {
    
    // Process user message and generate AI response
    static async processMessage(conversationId, userMessage, sessionId) {
        try {
            const startTime = Date.now();
            console.log(`🤖 Processing message: "${userMessage.substring(0, 50)}..."`);            
            // Step 1: Analyze intent
            const intent = await this.analyzeIntent(userMessage);
            console.log(`🎯 Intent detected: ${intent.name} (confidence: ${intent.confidence})`);            
            // Step 2: Get conversation context
            const context = await this.getConversationContext(conversationId, sessionId);
            
            // Step 3: Check for e-commerce specific actions
            const ecommerceAction = await this.checkEcommerceAction(userMessage, intent);
            
            // Step 4: Generate AI response
            const response = await this.generateResponse({
                userMessage,
                intent,
                context,
                ecommerceAction,
                conversationId,
                sessionId
            });
            
            const responseTime = Date.now() - startTime;
            
            // Step 5: Save AI response to database
            const aiMessage = await ChatMessage.addMessage(
                conversationId,
                'ai',
                response.text,
                response.type || 'text',
                response.metadata || null,
                {
                    confidence: intent.confidence,
                    intent: intent.name,
                    responseTime
                }
            );
            
            // Step 6: Update context
            await this.updateConversationContext(sessionId, {
                lastIntent: intent.name,
                lastUserMessage: userMessage,
                lastAIResponse: response.text,
                messageCount: (context.messageCount || 0) + 1
            });
            
            console.log(`✅ AI response generated in ${responseTime}ms`);
            
            return {
                message: aiMessage,
                intent: intent.name,
                confidence: intent.confidence,
                responseTime,
                ecommerceAction: ecommerceAction || null
            };
            
        } catch (error) {
            console.error('❌ AI processing error:', error);
            
            // Fallback response
            const fallbackMessage = await ChatMessage.addMessage(
                conversationId,
                'ai',
                'Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể nói rõ hơn không? Hoặc hãy thử những gợi ý sau:',
                'text',
                { fallback: true, error: error.message }
            );
            
            return {
                message: fallbackMessage,
                intent: 'unknown',
                confidence: 0,
                responseTime: 0,
                error: true
            };
        }
    }
    
    // Analyze user intent using keyword matching and NLP
    static async analyzeIntent(userMessage) {
        try {
            const message = userMessage.toLowerCase().trim();
            const tokens = tokenizer.tokenize(message);
            const stems = tokens.map(token => stemmer.stem(token));
            
            // Get all active intents from database
            const [intents] = await db.execute(`
                SELECT * FROM ai_intents 
                WHERE is_active = TRUE 
                ORDER BY priority_level ASC
            `);
            
            let bestMatch = {
                name: 'general',
                confidence: 0.3,
                template: 'Tôi có thể giúp gì cho bạn?'
            };
            
            // Check each intent for keyword matches
            for (const intent of intents) {
                const keywords = intent.keywords.toLowerCase().split(',').map(k => k.trim());
                let matchScore = 0;
                let matchCount = 0;
                
                for (const keyword of keywords) {
                    if (message.includes(keyword)) {
                        matchScore += 1;
                        matchCount++;
                    }
                    
                    // Check stemmed versions
                    const keywordStems = tokenizer.tokenize(keyword).map(t => stemmer.stem(t));
                    for (const stem of keywordStems) {
                        if (stems.includes(stem)) {
                            matchScore += 0.7;
                            matchCount++;
                        }
                    }
                }
                
                // Calculate confidence based on matches
                const confidence = Math.min(matchScore / keywords.length, 1.0);
                
                if (confidence > bestMatch.confidence && confidence >= intent.confidence_threshold) {
                    bestMatch = {
                        name: intent.intent_name,
                        confidence: parseFloat(confidence.toFixed(2)),
                        template: intent.response_template,
                        category: intent.category
                    };
                }
            }
            
            // Update intent usage count
            if (bestMatch.name !== 'general') {
                await db.execute(`
                    UPDATE ai_intents 
                    SET usage_count = usage_count + 1 
                    WHERE intent_name = ?
                `, [bestMatch.name]);
            }
            
            return bestMatch;
            
        } catch (error) {
            console.error('❌ Intent analysis error:', error);
            return {
                name: 'general',
                confidence: 0.1,
                template: 'Tôi có thể giúp gì cho bạn?'
            };
        }
    }
    
    // Get conversation context
    static async getConversationContext(conversationId, sessionId) {
        try {
            // Get recent messages for context
            const recentMessages = await ChatMessage.getRecentContext(conversationId, 5);
            
            // Get session context
            const session = await ChatSession.getSession(sessionId);
            const sessionContext = session ? session.conversation_context : {};
            
            return {
                recentMessages,
                sessionContext,
                messageCount: recentMessages.length
            };
        } catch (error) {
            console.error('❌ Error getting context:', error);
            return {
                recentMessages: [],
                sessionContext: {},
                messageCount: 0
            };
        }
    }
    
    // Check for e-commerce specific actions
    static async checkEcommerceAction(userMessage, intent) {
        try {
            const message = userMessage.toLowerCase();
            
            // Product search patterns
            const productPatterns = [
                /tìm sản phẩm (.+)/i,
                /mua (.+)/i,
                /có (.+) không/i,
                /giá (.+)/i
            ];
            
            // Order tracking patterns
            const orderPatterns = [
                /đơn hàng (.+)/i,
                /mã đơn (.+)/i,
                /order (.+)/i,
                /tra cứu (.+)/i
            ];
            
            // Check for product search
            for (const pattern of productPatterns) {
                const match = message.match(pattern);
                if (match) {
                    return {
                        type: 'product_search',
                        query: match[1].trim(),
                        intent: intent.name
                    };
                }
            }
            
            // Check for order tracking
            for (const pattern of orderPatterns) {
                const match = message.match(pattern);
                if (match) {
                    return {
                        type: 'order_tracking',
                        orderId: match[1].trim(),
                        intent: intent.name
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ E-commerce action check error:', error);
            return null;
        }
    }
    
    // Generate AI response
    static async generateResponse(data) {
        const { userMessage, intent, context, ecommerceAction, conversationId, sessionId } = data;
        
        try {
            // Handle e-commerce specific actions first
            if (ecommerceAction) {
                return await this.handleEcommerceAction(ecommerceAction, data);
            }
            
            // Use OpenAI if available
            if (openai && process.env.OPENAI_API_KEY) {
                return await this.generateOpenAIResponse(data);
            }
            
            // Fallback to template-based responses
            return await this.generateTemplateResponse(intent, context, userMessage);
            
        } catch (error) {
            console.error('❌ Response generation error:', error);
            return {
                text: 'Xin lỗi, tôi gặp chút vấn đề. Bạn có thể thử lại không?',
                type: 'text'
            };
        }
    }
    
    // Handle e-commerce specific actions
    static async handleEcommerceAction(action, data) {
        try {
            if (action.type === 'product_search') {
                return await this.handleProductSearch(action.query);
            }
            
            if (action.type === 'order_tracking') {
                return await this.handleOrderTracking(action.orderId, data.sessionId);
            }
            
            return {
                text: 'Tôi đã hiểu yêu cầu của bạn và đang xử lý...',
                type: 'text'
            };
        } catch (error) {
            console.error('❌ E-commerce action error:', error);
            return {
                text: 'Xin lỗi, tôi không thể thực hiện yêu cầu này lúc này.',
                type: 'text'
            };
        }
    }
    
    // Handle product search
    static async handleProductSearch(query) {
        try {
            // Search products using existing search system
            const [products] = await db.execute(`
                SELECT id, product_name, price, image_url, category_id, brand_id,
                       MATCH(product_name, description) AGAINST(? IN BOOLEAN MODE) as relevance
                FROM products 
                WHERE MATCH(product_name, description) AGAINST(? IN BOOLEAN MODE)
                AND is_active = TRUE
                ORDER BY relevance DESC
                LIMIT 5
            `, [query, query]);
            
            if (products.length === 0) {
                return {
                    text: `Không tìm thấy sản phẩm nào với từ khóa "${query}". Bạn có thể thử tìm với từ khóa khác không?`,
                    type: 'text'
                };
            }
            
            return {
                text: `Tôi đã tìm thấy ${products.length} sản phẩm phù hợp với "${query}":`,
                type: 'product_card',
                metadata: {
                    products: products,
                    query: query
                }
            };
        } catch (error) {
            console.error('❌ Product search error:', error);
            return {
                text: `Xin lỗi, tôi không thể tìm kiếm sản phẩm "${query}" lúc này. Vui lòng thử lại sau.`,
                type: 'text'
            };
        }
    }
    
    // Handle order tracking
    static async handleOrderTracking(orderId, sessionId) {
        try {
            // Try to find order by ID first
            let [orders] = await db.execute(`
                SELECT o.*, u.email 
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = ? OR o.order_number = ?
            `, [orderId, orderId]);
            
            if (orders.length === 0) {
                // If not found, ask for email
                await ChatSession.addToContext(sessionId, 'pending_order_lookup', orderId);
                
                return {
                    text: `Không tìm thấy đơn hàng với mã "${orderId}". Bạn có thể cung cấp email đặt hàng không?`,
                    type: 'text'
                };
            }
            
            const order = orders[0];
            return {
                text: `📦 Thông tin đơn hàng #${order.id}:`,
                type: 'order_info',
                metadata: {
                    order: order,
                    orderId: orderId
                }
            };
            
        } catch (error) {
            console.error('❌ Order tracking error:', error);
            return {
                text: `Xin lỗi, tôi không thể tra cứu đơn hàng "${orderId}" lúc này.`,
                type: 'text'
            };
        }
    }
    
    // Generate OpenAI response
    static async generateOpenAIResponse(data) {
        try {
            const { userMessage, intent, context } = data;
            
            const systemPrompt = `Bạn là trợ lý AI cho website thương mại điện tử. 
Bạn giúp khách hàng về:
- Tìm kiếm sản phẩm
- Tra cứu đơn hàng
- Hỗ trợ thanh toán
- Giải đáp câu hỏi

Trả lời bằng tiếng Việt, thân thiện và hữu ích.`;
            
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ];
            
            // Add context if available
            if (context.recentMessages && context.recentMessages.length > 0) {
                const contextStr = context.recentMessages
                    .map(msg => `${msg.sender_type}: ${msg.message_text}`)
                    .join('\n');
                messages.splice(1, 0, {
                    role: 'system', 
                    content: `Ngữ cảnh cuộc hội thoại trước:\n${contextStr}`
                });
            }
            
            const completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
                temperature: 0.7
            });
            
            const responseText = completion.choices[0].message.content.trim();
            
            return {
                text: responseText,
                type: 'text',
                metadata: {
                    openai_model: completion.model,
                    tokens_used: completion.usage?.total_tokens || 0
                }
            };
            
        } catch (error) {
            console.error('❌ OpenAI response error:', error);
            throw error;
        }
    }
    
    // Generate template-based response
    static async generateTemplateResponse(intent, context, userMessage) {
        try {
            // Get quick replies for this intent
            const [quickReplies] = await db.execute(`
                SELECT title, message FROM chat_quick_replies 
                WHERE category = ? AND is_active = TRUE
                ORDER BY display_order ASC
                LIMIT 3
            `, [intent.category || 'support']);
            
            let responseText = intent.template || 'Tôi có thể giúp gì cho bạn?';
            
            // Add personalization based on context
            if (context.messageCount > 5) {
                responseText = 'Tôi thấy bạn có nhiều câu hỏi. ' + responseText;
            }
            
            return {
                text: responseText,
                type: 'text',
                metadata: {
                    intent: intent.name,
                    quick_replies: quickReplies,
                    template_used: true
                }
            };
        } catch (error) {
            console.error('❌ Template response error:', error);
            return {
                text: 'Tôi có thể giúp gì cho bạn?',
                type: 'text'
            };
        }
    }
    
    // Update conversation context
    static async updateConversationContext(sessionId, updates) {
        try {
            const session = await ChatSession.getSession(sessionId);
            if (!session) return;
            
            const currentContext = session.conversation_context || {};
            const newContext = { ...currentContext, ...updates };
            
            await ChatSession.updateContext(sessionId, newContext);
        } catch (error) {
            console.error('❌ Context update error:', error);
        }
    }
    
    // Analyze message sentiment
    static analyzeSentiment(text) {
        try {
            const result = sentimentAnalyzer.analyze(text);
            return {
                score: result.score,
                comparative: result.comparative,
                positive: result.positive,
                negative: result.negative,
                sentiment: result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral'
            };
        } catch (error) {
            console.error('❌ Sentiment analysis error:', error);
            return { sentiment: 'neutral', score: 0 };
        }
    }
}

module.exports = AIProcessor;