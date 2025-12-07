import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import '../styles/ChatBot.css';

interface Product {
  product_id: number;
  product_name: string;
  product_slug: string;
  base_price: number;
  sale_price: number;
  brand_name?: string;
  stock_quantity: number;
  image_url?: string;
  discount_percentage?: number;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  products?: Product[];
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = async () => {
    try {
      const response = await api.chat.startChat();
      if (response.data.success) {
        setSessionId(response.data.data.session_id);
        
        // Add welcome message
        const welcomeMessage: Message = {
          id: Date.now(),
          text: 'Xin chào! Tôi là trợ lý ảo của VNBSports. Tôi có thể giúp gì cho bạn?',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleToggle = () => {
    if (!isOpen && !sessionId) {
      startChat();
    }
    setIsOpen(!isOpen);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !sessionId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await api.chat.sendMessage(sessionId, inputText);

      setIsTyping(false);

      if (response.data.success) {
        const botMessage: Message = {
          id: Date.now() + 1,
          text: response.data.data.ai_response?.message_text || 'Xin lỗi, tôi không hiểu câu hỏi của bạn.',
          sender: 'bot',
          timestamp: new Date(),
          products: response.data.data.products || []
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      setIsTyping(false);
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickReplies = [
    'Tôi muốn tìm vợt Yonex giá rẻ',
    'Giày Victor có gì?',
    'Sản phẩm nào đang sale?',
    'Áo Lining giá bao nhiêu?'
  ];

  const handleQuickReply = (text: string) => {
    setInputText(text);
  };

  return (
    <>
      {/* Chat Button */}
      <div 
        className={`chatbot-button ${isOpen ? 'hidden' : ''}`}
        onClick={handleToggle}
      >
        <i className="fas fa-comments"></i>
        <span className="chatbot-badge">?</span>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                <i className="fas fa-robot"></i>
              </div>
              <div className="chatbot-info">
                <h4>VNBSports Assistant</h4>
                <span className="chatbot-status">
                  <span className="status-dot"></span> Đang hoạt động
                </span>
              </div>
            </div>
            <button className="chatbot-close" onClick={handleToggle}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`chatbot-message ${message.sender}`}
              >
                <div className="message-content">
                  {message.text}
                </div>
                
                {/* Product Cards */}
                {message.products && message.products.length > 0 && (
                  <div className="product-cards">
                    {message.products.map((product) => {
                      const finalPrice = (product.sale_price > 0 && product.sale_price < product.base_price) 
                        ? product.sale_price 
                        : product.base_price;
                      const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
                      
                      return (
                        <a 
                          key={product.product_id}
                          href={`/products/${product.product_slug}`}
                          className="product-card"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {hasDiscount && (
                            <div className="discount-badge">-{product.discount_percentage}%</div>
                          )}
                          <img 
                            src={product.image_url || '/placeholder.jpg'} 
                            alt={product.product_name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.jpg';
                            }}
                          />
                          <div className="product-info">
                            <h4>{product.product_name}</h4>
                            {product.brand_name && (
                              <span className="brand">{product.brand_name}</span>
                            )}
                            <div className="price">
                              {hasDiscount && (
                                <span className="old-price">{product.base_price.toLocaleString('vi-VN')}đ</span>
                              )}
                              <span className="final-price">{finalPrice.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <span className="stock">Còn {product.stock_quantity} sản phẩm</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
                
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chatbot-message bot">
                <div className="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && (
            <div className="chatbot-quick-replies">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  className="quick-reply-btn"
                  onClick={() => handleQuickReply(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              className="send-btn"
              onClick={sendMessage}
              disabled={!inputText.trim()}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
