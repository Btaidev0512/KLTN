// ULTRA SIMPLE AI PROCESSOR
const db = require('../config/database');

class UltraSimpleAI {
    
    // Helper: Extract brand names from message
    static extractBrand(message) {
        const brands = ['yonex', 'victor', 'lining', 'li-ning', 'mizuno', 'adidas', 'nike', 'apacs', 'vnb'];
        const found = brands.find(brand => message.includes(brand));
        return found;
    }
    
    // Helper: Extract price range from message
    static extractPriceRange(message) {
        if (message.includes('rẻ') || message.includes('giá tốt') || message.includes('dưới')) {
            return { min: 0, max: 500000 };
        }
        if (message.includes('trung bình') || message.includes('vừa phải')) {
            return { min: 500000, max: 1500000 };
        }
        if (message.includes('cao cấp') || message.includes('xịn') || message.includes('đắt')) {
            return { min: 1500000, max: 10000000 };
        }
        return null;
    }
    
    // Helper: Build product query with filters
    static async searchProducts(category, brand = null, priceRange = null, limit = 5) {
        let query = `
            SELECT p.product_id, p.product_name, p.product_slug, p.base_price, p.sale_price, 
                   p.stock_quantity, b.brand_name, c.category_name,
                   COALESCE(
                       (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1),
                       p.image_url
                   ) as image_url,
                   CASE WHEN p.sale_price > 0 AND p.sale_price < p.base_price 
                        THEN ROUND(((p.base_price - p.sale_price) / p.base_price) * 100, 0)
                        ELSE 0 
                   END as discount_percentage
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.stock_quantity > 0 AND p.status = 'active'
        `;
        const params = [];
        
        if (category) {
            query += ' AND (p.product_name LIKE ? OR c.category_name LIKE ?)';
            params.push(`%${category}%`, `%${category}%`);
        }
        
        if (brand) {
            query += ' AND b.brand_name LIKE ?';
            params.push(`%${brand}%`);
        }
        
        if (priceRange) {
            const finalPrice = 'CASE WHEN p.sale_price > 0 AND p.sale_price < p.base_price THEN p.sale_price ELSE p.base_price END';
            query += ` AND ${finalPrice} BETWEEN ? AND ?`;
            params.push(priceRange.min, priceRange.max);
        }
        
        query += ' ORDER BY p.created_at DESC LIMIT ?';
        params.push(limit);
        
        const [products] = await db.execute(query, params);
        return products;
    }
    
    // Format product list for response
    static formatProductList(products) {
        if (products.length === 0) return null;
        
        let text = '';
        products.forEach((p, i) => {
            const finalPrice = (p.sale_price > 0 && p.sale_price < p.base_price) ? p.sale_price : p.base_price;
            text += `${i+1}. **${p.product_name}** ${p.brand_name ? `(${p.brand_name})` : ''}\n`;
            
            if (p.discount_percentage > 0) {
                text += `   💰 ~~${p.base_price.toLocaleString('vi-VN')}đ~~ → **${finalPrice.toLocaleString('vi-VN')}đ** (-${p.discount_percentage}%)\n`;
            } else {
                text += `   💰 ${finalPrice.toLocaleString('vi-VN')}đ\n`;
            }
            
            text += `   📦 Còn ${p.stock_quantity} sản phẩm\n`;
            text += `   🔗 /products/${p.product_slug}\n\n`;
        });
        
        return { text, products };
    }
    
    static async processMessage(conversationId, userMessage, sessionId) {
        console.log(`🤖 UltraSimpleAI processing: "${userMessage}"`);
        
        try {
            // Direct intent matching
            const message = userMessage.toLowerCase().trim();
            let responseText = "";
            let intentName = "general";
            let productData = null;
            
            // 1. GREETING
            if (message.includes('xin chào') || message.includes('hello') || message.includes('hi') || message.includes('chào')) {
                responseText = "Xin chào! Tôi là trợ lý AI của VNBSports. Tôi có thể giúp gì cho bạn?\n\n💡 Bạn có thể hỏi tôi về:\n• Sản phẩm (vợt, giày, áo...)\n• Đơn hàng\n• Thanh toán & Giao hàng\n• Khuyến mãi";
                intentName = "greeting";
            }
            
            // 2. PRODUCT SEARCH - VỢT CẦU LÔNG (với brand và price filter)
            else if (message.includes('vợt') || message.includes('racket')) {
                const brand = this.extractBrand(message);
                const priceRange = this.extractPriceRange(message);
                const products = await this.searchProducts('vợt', brand, priceRange, 5);
                
                if (products.length > 0) {
                    const formatted = this.formatProductList(products);
                    productData = formatted.products;
                    
                    responseText = "🏸 ";
                    if (brand) responseText += `Vợt ${brand.toUpperCase()} `;
                    else responseText += "Vợt cầu lông ";
                    if (priceRange) {
                        if (priceRange.max <= 500000) responseText += "giá rẻ ";
                        else if (priceRange.min >= 1500000) responseText += "cao cấp ";
                    }
                    responseText += `có sẵn:\n\n${formatted.text}`;
                    responseText += "\n💡 Click vào link để xem chi tiết và đặt hàng!";
                } else {
                    responseText = `Xin lỗi, hiện tại chúng tôi không có vợt ${brand ? brand.toUpperCase() : ''} ${priceRange ? 'trong tầm giá này' : 'như bạn tìm'}. Bạn có thể thử:\n\n• Tìm thương hiệu khác\n• Mở rộng khoảng giá\n• Gọi hotline 1900-xxxx để được tư vấn! 📞`;
                }
                intentName = "product_racket";
            }
            
            // 3. PRODUCT SEARCH - GIÀY CẦU LÔNG (với brand và price filter)
            else if (message.includes('giày') || message.includes('shoes')) {
                const brand = this.extractBrand(message);
                const priceRange = this.extractPriceRange(message);
                const products = await this.searchProducts('giày', brand, priceRange, 5);
                
                if (products.length > 0) {
                    const formatted = this.formatProductList(products);
                    productData = formatted.products;
                    
                    responseText = "👟 ";
                    if (brand) responseText += `Giày ${brand.toUpperCase()} `;
                    else responseText += "Giày cầu lông ";
                    if (priceRange) {
                        if (priceRange.max <= 500000) responseText += "giá tốt ";
                        else if (priceRange.min >= 1500000) responseText += "cao cấp ";
                    }
                    responseText += `có sẵn:\n\n${formatted.text}`;
                    responseText += "\n💡 Size giày từ 36-44. Click link để chọn size và đặt hàng!";
                } else {
                    responseText = `Xin lỗi, không tìm thấy giày ${brand ? brand.toUpperCase() : ''} ${priceRange ? 'trong tầm giá này' : 'phù hợp'}. Bạn có thể thử:\n\n• Xem thương hiệu khác (Yonex, Victor, Lining...)\n• Điều chỉnh khoảng giá\n• Liên hệ hotline 1900-xxxx! 📞`;
                }
                intentName = "product_shoes";
            }
            
            // 4. PRODUCT SEARCH - ÁO CẦU LÔNG (với brand và price filter)
            else if (message.includes('áo') || message.includes('quần áo') || message.includes('shirt')) {
                const brand = this.extractBrand(message);
                const priceRange = this.extractPriceRange(message);
                const products = await this.searchProducts('áo', brand, priceRange, 5);
                
                if (products.length > 0) {
                    const formatted = this.formatProductList(products);
                    productData = formatted.products;
                    
                    responseText = "👕 ";
                    if (brand) responseText += `Áo ${brand.toUpperCase()} `;
                    else responseText += "Áo cầu lông ";
                    if (priceRange) {
                        if (priceRange.max <= 500000) responseText += "giá tốt ";
                        else if (priceRange.min >= 1500000) responseText += "cao cấp ";
                    }
                    responseText += `có sẵn:\n\n${formatted.text}`;
                    responseText += "\n💡 Size: S, M, L, XL, XXL. Click link để chọn size!";
                } else {
                    responseText = `Xin lỗi, không có áo ${brand ? brand.toUpperCase() : ''} ${priceRange ? 'trong tầm giá này' : 'phù hợp'}. Bạn có thể:\n\n• Xem thương hiệu khác\n• Thử khoảng giá khác\n• Hotline: 1900-xxxx 📞`;
                }
                intentName = "product_clothes";
            }
            
            // 5. GENERAL PRODUCT SEARCH
            else if (message.includes('sản phẩm') || message.includes('tìm') || message.includes('mua') || message.includes('có gì')) {
                responseText = "🛍️ VNBSports chuyên cung cấp:\n\n🏸 Vợt cầu lông (Yonex, Victor, Lining...)\n👟 Giày cầu lông chuyên dụng\n👕 Áo quần thể thao\n🎒 Túi đựng vợt & phụ kiện\n🏐 Cầu lông chính hãng\n\nBạn muốn tìm loại sản phẩm nào?";
                intentName = "product_search";
            }
            
            // 6. PRICE INQUIRY
            else if (message.includes('giá') || message.includes('bao nhiêu') || message.includes('price')) {
                responseText = "💰 Giá sản phẩm tại VNBSports:\n\n🏸 Vợt: 200k - 3 triệu\n👟 Giày: 300k - 2 triệu\n👕 Áo: 100k - 500k\n🎒 Túi: 150k - 800k\n🏐 Cầu: 50k - 150k/hộp\n\nBạn muốn xem sản phẩm nào cụ thể?";
                intentName = "price_inquiry";
            }
            
            // 7. ORDER TRACKING
            else if (message.includes('đơn hàng') || message.includes('order') || message.includes('tracking') || message.includes('kiểm tra đơn')) {
                responseText = "📦 Để kiểm tra đơn hàng, bạn cần:\n\n1️⃣ Đăng nhập vào tài khoản\n2️⃣ Vào mục 'Đơn hàng của tôi'\n3️⃣ Xem chi tiết đơn hàng\n\nHoặc cung cấp mã đơn hàng (VD: ORD123456) để tôi tra cứu giúp bạn!";
                intentName = "order_tracking";
            }
            
            // 8. PAYMENT
            else if (message.includes('thanh toán') || message.includes('payment') || message.includes('tiền') || message.includes('chuyển khoản')) {
                responseText = "💳 Phương thức thanh toán:\n\n✅ COD (Thanh toán khi nhận hàng)\n✅ Chuyển khoản ngân hàng\n✅ MoMo / ZaloPay\n✅ Thẻ tín dụng/ghi nợ\n\n🏦 Thông tin chuyển khoản:\n• Ngân hàng: Vietcombank\n• STK: 0123456789\n• Chủ TK: VNBSPORTS\n\nBạn muốn thanh toán bằng phương thức nào?";
                intentName = "payment";
            }
            
            // 9. SHIPPING
            else if (message.includes('ship') || message.includes('giao hàng') || message.includes('vận chuyển')) {
                responseText = "🚚 Chính sách giao hàng:\n\n📍 Nội thành Hà Nội/HCM: 1-2 ngày\n📍 Tỉnh thành khác: 2-5 ngày\n💰 Phí ship: MIỄN PHÍ đơn từ 500k\n\n✅ Được kiểm tra hàng trước khi thanh toán\n✅ Đổi trả trong 7 ngày nếu lỗi\n\nBạn ở khu vực nào?";
                intentName = "shipping";
            }
            
            // 10. PROMOTION & SALE PRODUCTS
            else if (message.includes('khuyến mãi') || message.includes('giảm giá') || message.includes('sale') || message.includes('ưu đãi')) {
                // Check if asking for sale products
                if (message.includes('sản phẩm') || message.includes('có gì') || message.includes('nào')) {
                    const [saleProducts] = await db.execute(`
                        SELECT p.product_id, p.product_name, p.product_slug, p.base_price, p.sale_price, 
                               b.brand_name, p.stock_quantity,
                               COALESCE(
                                   (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1),
                                   p.image_url
                               ) as image_url,
                               ROUND(((p.base_price - p.sale_price) / p.base_price) * 100, 0) as discount_percentage
                        FROM products p
                        LEFT JOIN brands b ON p.brand_id = b.brand_id
                        WHERE p.sale_price > 0 AND p.sale_price < p.base_price AND p.stock_quantity > 0
                        ORDER BY discount_percentage DESC
                        LIMIT 5
                    `);
                    
                    if (saleProducts.length > 0) {
                        const formatted = this.formatProductList(saleProducts);
                        productData = formatted.products;
                        responseText = `🔥 **TOP SẢN PHẨM GIẢM GIÁ HOT:**\n\n${formatted.text}`;
                        responseText += "\n💡 Click link để đặt hàng ngay!";
                    } else {
                        responseText = "🎉 Hiện tại chương trình sale đang cập nhật. Bạn có thể dùng mã giảm giá:\n\n💡 VNBNEW20 - Giảm 20% KH mới\n💡 VNBFREE - Freeship\n💡 VNBCOMBO - Giảm 100k combo";
                    }
                } else {
                    responseText = "🎉 Chương trình khuyến mãi:\n\n🔥 Giảm 20% cho đơn hàng đầu tiên\n🔥 Miễn phí ship cho đơn từ 500k\n🔥 Tặng vợt khi mua combo từ 2 triệu\n\n💡 Nhập mã:\n• VNBNEW20 - Giảm 20% KH mới\n• VNBFREE - Freeship\n• VNBCOMBO - Giảm 100k combo\n\nBạn muốn áp dụng mã nào?";
                }
                intentName = "promotion";
            }
            
            // 11. ACCOUNT
            else if (message.includes('tài khoản') || message.includes('đăng nhập') || message.includes('đăng ký') || message.includes('account')) {
                responseText = "👤 Hướng dẫn tài khoản:\n\n✅ Đăng ký: Click 'Đăng ký' góc trên\n✅ Đăng nhập: Email + Mật khẩu\n✅ Quên mật khẩu: Click 'Quên mật khẩu'\n\n🎁 Lợi ích khi đăng ký:\n• Tích điểm thành viên\n• Theo dõi đơn hàng\n• Nhận ưu đãi riêng\n\nBạn cần hỗ trợ gì về tài khoản?";
                intentName = "account";
            }
            
            // 12. FAREWELL
            else if (message.includes('cảm ơn') || message.includes('tạm biệt') || message.includes('bye') || message.includes('ok')) {
                responseText = "Cảm ơn bạn đã liên hệ VNBSports! 💚\n\nNếu cần hỗ trợ thêm, hãy nhắn tin bất cứ lúc nào nhé!\n\n📞 Hotline: 1900-xxxx\n⏰ 8:00 - 22:00 hàng ngày\n\nChúc bạn chơi cầu lông vui vẻ! 🏸";
                intentName = "farewell";
            }
            
            // 13. DEFAULT - USE KEYWORDS FROM DATABASE
            else {
                const [keywords] = await db.execute(
                    'SELECT response_template FROM chat_keywords WHERE keyword LIKE ? AND is_active = 1 ORDER BY priority DESC LIMIT 1',
                    [`%${message.split(' ')[0]}%`]
                );
                
                if (keywords.length > 0) {
                    responseText = keywords[0].response_template;
                    intentName = "keyword_match";
                } else {
                    responseText = "Tôi có thể giúp gì cho bạn?\n\n💡 Bạn có thể hỏi về:\n• Sản phẩm (vợt, giày, áo...)\n• Giá cả & Khuyến mãi\n• Đơn hàng & Giao hàng\n• Thanh toán & Tài khoản";
                    intentName = "general";
                }
            }
            
            console.log(`🎯 Intent: ${intentName}`);
            console.log(`💬 Response: ${responseText.substring(0, 50)}...`);
            console.log(`📦 Products: ${productData ? productData.length : 0}`);
            
            // Simple database insert
            console.log('💾 Inserting into database...');
            const query = `
                INSERT INTO chat_messages (
                    conversation_id, sender_type, message_text, message_type, intent_detected, created_at
                ) VALUES (?, ?, ?, ?, ?, NOW())
            `;
            
            const [result] = await db.execute(query, [
                conversationId,
                'ai',
                responseText,
                'text',
                intentName
            ]);
            
            console.log(`✅ Message inserted with ID: ${result.insertId}`);
            
            // Return response data with product information
            const responseData = {
                id: result.insertId,
                conversation_id: conversationId,
                sender_type: 'ai',
                message_text: responseText,
                message_type: 'text',
                intent_detected: intentName,
                products: productData || [],
                created_at: new Date().toISOString()
            };
            
            return {
                message: responseData,
                intent: intentName,
                confidence: 1.0,
                responseTime: 100,
                products: productData || []
            };
            
        } catch (error) {
            console.error('❌ UltraSimpleAI error:', error);
            
            // Ultra simple fallback
            const fallbackText = "Xin lỗi, tôi gặp chút vấn đề kỹ thuật. Bạn có thể thử lại không? 🔧";
            
            try {
                const [result] = await db.execute(
                    'INSERT INTO chat_messages (conversation_id, sender_type, message_text, message_type, created_at) VALUES (?, ?, ?, ?, NOW())',
                    [conversationId, 'ai', fallbackText, 'text']
                );
                
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
                console.error('❌ Database fallback also failed:', dbError);
                throw new Error('Complete AI system failure');
            }
        }
    }
}

module.exports = UltraSimpleAI;