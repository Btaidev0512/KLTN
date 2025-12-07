// 🤖 OPENAI SERVICE
// Handles OpenAI API integration for chat responses

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}) : null;

// System prompts for different contexts
const SYSTEM_PROMPTS = {
    general: `Bạn là trợ lý AI thân thiện cho website thương mại điện tử tại Việt Nam. 
Bạn giúp khách hàng về:
- Tìm kiếm sản phẩm
- Tra cứu đơn hàng  
- Hỗ trợ thanh toán
- Giải đáp câu hỏi về sản phẩm và dịch vụ

Hãy trả lời bằng tiếng Việt, ngắn gọn, thân thiện và hữu ích. Sử dụng emoji để tạo cảm giác thân thiện.`,
    
    product: `Bạn là chuyên viên tư vấn sản phẩm cho cửa hàng online. 
Giúp khách hàng:
- Tìm sản phẩm phù hợp
- So sánh tính năng và giá cả
- Tư vấn lựa chọn
- Giải thích thông số kỹ thuật

Trả lời chi tiết, chuyên nghiệp nhưng dễ hiểu.`,
    
    order: `Bạn là nhân viên hỗ trợ đơn hàng. Giúp khách hàng:
- Tra cứu tình trạng đơn hàng
- Giải thích quy trình vận chuyển
- Xử lý các vấn đề về đơn hàng
- Hướng dẫn huỷ đơn hoặc đổi trả

Luôn đảm bảo thông tin chính xác và cập nhật.`,
    
    payment: `Bạn là chuyên viên hỗ trợ thanh toán. Giúp khách hàng:
- Hướng dẫn các phương thức thanh toán
- Giải quyết lỗi thanh toán
- Giải thích phí dịch vụ
- Hỗ trợ hoàn tiền

Cung cấp thông tin rõ ràng và đáng tin cậy.`
};

class OpenAIService {
    
    // Check if OpenAI is available
    static isAvailable() {
        return openai !== null && process.env.OPENAI_API_KEY;
    }
    
    // Generate chat completion
    static async generateResponse({
        userMessage,
        context = [],
        intent = 'general',
        maxTokens = 500,
        temperature = 0.7
    }) {
        try {
            if (!this.isAvailable()) {
                throw new Error('OpenAI API key not configured');
            }
            
            // Select appropriate system prompt
            const systemPrompt = SYSTEM_PROMPTS[intent] || SYSTEM_PROMPTS.general;
            
            // Build messages array
            const messages = [
                { role: 'system', content: systemPrompt }
            ];
            
            // Add context from previous messages
            if (context && context.length > 0) {
                const contextStr = context
                    .slice(-3) // Last 3 messages for context
                    .map(msg => `${msg.sender_type === 'user' ? 'Khách hàng' : 'Bạn'}: ${msg.message_text}`)
                    .join('\n');
                
                messages.push({
                    role: 'system',
                    content: `Ngữ cảnh cuộc hội thoại gần đây:\n${contextStr}`
                });
            }
            
            // Add current user message
            messages.push({
                role: 'user',
                content: userMessage
            });
            
            console.log('🤖 Calling OpenAI API...');
            
            // Call OpenAI
            const completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: maxTokens,
                temperature: temperature,
                top_p: 0.9,
                frequency_penalty: 0.3,
                presence_penalty: 0.3
            });
            
            const response = completion.choices[0].message.content.trim();
            
            console.log(`✅ OpenAI response generated (${completion.usage?.total_tokens || 0} tokens)`);
            
            return {
                text: response,
                model: completion.model,
                tokens_used: completion.usage?.total_tokens || 0,
                prompt_tokens: completion.usage?.prompt_tokens || 0,
                completion_tokens: completion.usage?.completion_tokens || 0
            };
            
        } catch (error) {
            console.error('❌ OpenAI API error:', error);
            
            // Handle specific error types
            if (error.code === 'insufficient_quota') {
                throw new Error('OpenAI API quota exceeded');
            } else if (error.code === 'invalid_api_key') {
                throw new Error('Invalid OpenAI API key');
            } else if (error.code === 'model_not_found') {
                throw new Error('OpenAI model not found');
            }
            
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }
    
    // Generate product recommendation response
    static async generateProductResponse(products, query) {
        try {
            if (!this.isAvailable()) {
                return this.generateFallbackProductResponse(products, query);
            }
            
            const productList = products.map(p => 
                `- ${p.product_name}: ${p.price.toLocaleString('vi-VN')}đ`
            ).join('\n');
            
            const prompt = `Khách hàng tìm kiếm "${query}" và tôi đã tìm thấy các sản phẩm sau:\n${productList}\n\nHãy viết một phản hồi ngắn gọn, thân thiện để giới thiệu các sản phẩm này.`;
            
            const response = await this.generateResponse({
                userMessage: prompt,
                intent: 'product',
                maxTokens: 300
            });
            
            return response.text;
            
        } catch (error) {
            console.error('❌ Product response error:', error);
            return this.generateFallbackProductResponse(products, query);
        }
    }
    
    // Generate order status response
    static async generateOrderResponse(order, orderId) {
        try {
            if (!this.isAvailable()) {
                return this.generateFallbackOrderResponse(order, orderId);
            }
            
            const orderInfo = `Đơn hàng #${order.id} - Trạng thái: ${order.status} - Tổng tiền: ${order.total_amount.toLocaleString('vi-VN')}đ - Ngày đặt: ${new Date(order.created_at).toLocaleDateString('vi-VN')}`;
            
            const prompt = `Khách hàng hỏi về đơn hàng "${orderId}". Thông tin đơn hàng: ${orderInfo}\n\nHãy viết phản hồi thân thiện, cung cấp thông tin đơn hàng và hướng dẫn tiếp theo (nếu cần).`;
            
            const response = await this.generateResponse({
                userMessage: prompt,
                intent: 'order',
                maxTokens: 300
            });
            
            return response.text;
            
        } catch (error) {
            console.error('❌ Order response error:', error);
            return this.generateFallbackOrderResponse(order, orderId);
        }
    }
    
    // Fallback responses when OpenAI is not available
    static generateFallbackProductResponse(products, query) {
        if (products.length === 0) {
            return `Xin lỗi, không tìm thấy sản phẩm nào cho "${query}". Bạn có thể thử từ khóa khác không? 🔍`;
        }
        
        return `🛒 Tôi đã tìm thấy ${products.length} sản phẩm phù hợp với "${query}"! \n\nBạn có thể xem chi tiết các sản phẩm bên dưới. Nếu cần tư vấn thêm, hãy cho tôi biết nhé! 😊`;
    }
    
    static generateFallbackOrderResponse(order, orderId) {
        const statusMap = {
            'pending': 'đang xử lý',
            'confirmed': 'đã xác nhận',
            'shipped': 'đang vận chuyển',
            'delivered': 'đã giao',
            'cancelled': 'đã huỷ'
        };
        
        const vietnameseStatus = statusMap[order.status] || order.status;
        
        return `📦 Thông tin đơn hàng #${order.id}:\n\n` +
               `• Trạng thái: ${vietnameseStatus}\n` +
               `• Tổng tiền: ${order.total_amount.toLocaleString('vi-VN')}đ\n` +
               `• Ngày đặt: ${new Date(order.created_at).toLocaleDateString('vi-VN')}\n\n` +
               `Bạn có câu hỏi gì khác về đơn hàng không? 😊`;
    }
    
    // Get API usage statistics
    static async getUsageStats() {
        try {
            if (!this.isAvailable()) {
                return { available: false, message: 'OpenAI not configured' };
            }
            
            // Note: OpenAI doesn't provide real-time usage stats via API
            // This is a placeholder for future implementation
            return {
                available: true,
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                status: 'active'
            };
            
        } catch (error) {
            console.error('❌ OpenAI usage stats error:', error);
            return { available: false, error: error.message };
        }
    }
    
    // Test OpenAI connection
    static async testConnection() {
        try {
            if (!this.isAvailable()) {
                return { success: false, message: 'OpenAI API key not configured' };
            }
            
            const testResponse = await this.generateResponse({
                userMessage: 'Hello, please respond with "Test successful"',
                intent: 'general',
                maxTokens: 50
            });
            
            return {
                success: true,
                message: 'OpenAI connection successful',
                response: testResponse.text,
                model: testResponse.model
            };
            
        } catch (error) {
            return {
                success: false,
                message: 'OpenAI connection failed',
                error: error.message
            };
        }
    }
}

module.exports = OpenAIService;