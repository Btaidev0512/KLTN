-- Create banners table for homepage carousel
CREATE TABLE IF NOT EXISTS banners (
    banner_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    tag_text VARCHAR(50),
    tag_type VARCHAR(50),
    button_text VARCHAR(100) NOT NULL DEFAULT 'KHÁM PHÁ NGAY',
    button_link VARCHAR(255) NOT NULL DEFAULT '/products',
    background_image VARCHAR(500),
    background_gradient VARCHAR(255) DEFAULT 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default banners
INSERT INTO banners (title, subtitle, tag_text, tag_type, button_text, button_link, background_gradient, is_active, sort_order) VALUES
('CONFIDENCE FROM EVERY DIRECTION TO EVERY DIRECTION', NULL, 'NEW', 'ECLIPSION', 'KHÁM PHÁ NGAY', '/products', 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', 1, 1),
('ƯU ĐÃI LỚN DÀNH CHO BẠN', 'Giảm giá sốc các sản phẩm cao cấp', 'SALE', '50% OFF', 'MUA NGAY', '/sale', 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)', 1, 2),
('BỘ SƯU TẬP MỚI NHẤT', 'Thiết bị cầu lông chuyên nghiệp', 'HOT', 'TRENDING', 'XEM NGAY', '/products', 'linear-gradient(135deg, #27AE60 0%, #229954 100%)', 1, 3);
