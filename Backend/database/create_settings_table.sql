-- =====================================================
-- Settings Table for E-commerce Admin Panel
-- Stores all configurable settings for the application
-- =====================================================

USE ecommerce_db;

-- Drop table if exists (for fresh install)
DROP TABLE IF EXISTS settings;

-- Create settings table
CREATE TABLE settings (
    setting_id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique key for the setting',
    setting_value TEXT COMMENT 'Value of the setting (can be text, number, JSON)',
    setting_type ENUM('text', 'number', 'boolean', 'json', 'file') NOT NULL DEFAULT 'text' COMMENT 'Data type of the setting',
    category ENUM('general', 'email', 'payment', 'shipping', 'tax', 'advanced') NOT NULL COMMENT 'Setting category',
    display_name VARCHAR(200) COMMENT 'Human-readable name for UI',
    description TEXT COMMENT 'Description of what this setting does',
    is_public BOOLEAN DEFAULT FALSE COMMENT 'If TRUE, can be accessed by frontend without auth',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert Default Settings
-- =====================================================

-- GENERAL SETTINGS
INSERT INTO settings (setting_key, setting_value, setting_type, category, display_name, description, is_public) VALUES
('shop_name', 'Cửa hàng cầu lông ABC', 'text', 'general', 'Tên cửa hàng', 'Tên hiển thị của cửa hàng', TRUE),
('shop_tagline', 'Chuyên cung cấp thiết bị cầu lông chính hãng', 'text', 'general', 'Slogan', 'Slogan của cửa hàng', TRUE),
('contact_email', 'shop@badminton.com', 'text', 'general', 'Email liên hệ', 'Email chính để liên hệ', TRUE),
('contact_phone', '0901234567', 'text', 'general', 'Số điện thoại', 'Số điện thoại liên hệ', TRUE),
('shop_address', '123 Nguyễn Văn Linh, Quận 7, TP.HCM', 'text', 'general', 'Địa chỉ', 'Địa chỉ cửa hàng', TRUE),
('website_url', 'https://badminton-shop.com', 'text', 'general', 'Website URL', 'URL chính của website', TRUE),
('logo_url', '/uploads/logo.png', 'file', 'general', 'Logo', 'Logo cửa hàng', TRUE),
('favicon_url', '/uploads/favicon.ico', 'file', 'general', 'Favicon', 'Icon hiển thị trên tab browser', TRUE),
('currency', 'VND', 'text', 'general', 'Đơn vị tiền tệ', 'Đơn vị tiền tệ sử dụng', TRUE),
('timezone', 'Asia/Ho_Chi_Minh', 'text', 'general', 'Múi giờ', 'Múi giờ của hệ thống', FALSE),
('date_format', 'DD/MM/YYYY', 'text', 'general', 'Định dạng ngày', 'Định dạng hiển thị ngày tháng', FALSE),
('time_format', '24h', 'text', 'general', 'Định dạng giờ', '12h hoặc 24h', FALSE);

-- EMAIL SETTINGS (SMTP Configuration)
INSERT INTO settings (setting_key, setting_value, setting_type, category, display_name, description, is_public) VALUES
('smtp_enabled', 'false', 'boolean', 'email', 'Bật SMTP', 'Kích hoạt gửi email qua SMTP', FALSE),
('smtp_host', 'smtp.gmail.com', 'text', 'email', 'SMTP Host', 'Máy chủ SMTP', FALSE),
('smtp_port', '587', 'number', 'email', 'SMTP Port', 'Cổng SMTP (587 cho TLS, 465 cho SSL)', FALSE),
('smtp_secure', 'true', 'boolean', 'email', 'SSL/TLS', 'Sử dụng kết nối bảo mật', FALSE),
('smtp_username', '', 'text', 'email', 'SMTP Username', 'Tên đăng nhập SMTP', FALSE),
('smtp_password', '', 'text', 'email', 'SMTP Password', 'Mật khẩu SMTP (được mã hóa)', FALSE),
('smtp_from_name', 'Cửa hàng cầu lông ABC', 'text', 'email', 'Tên người gửi', 'Tên hiển thị khi gửi email', FALSE),
('smtp_from_email', 'noreply@badminton.com', 'text', 'email', 'Email người gửi', 'Địa chỉ email người gửi', FALSE),
('email_order_confirmation', 'true', 'boolean', 'email', 'Email xác nhận đơn hàng', 'Gửi email khi đơn hàng được đặt', FALSE),
('email_order_shipped', 'true', 'boolean', 'email', 'Email thông báo giao hàng', 'Gửi email khi đơn hàng được giao', FALSE),
('email_order_delivered', 'true', 'boolean', 'email', 'Email xác nhận đã giao', 'Gửi email khi đơn hàng đã giao thành công', FALSE);

-- PAYMENT SETTINGS
INSERT INTO settings (setting_key, setting_value, setting_type, category, display_name, description, is_public) VALUES
('payment_cod_enabled', 'true', 'boolean', 'payment', 'COD (Ship COD)', 'Cho phép thanh toán khi nhận hàng', TRUE),
('payment_vnpay_enabled', 'false', 'boolean', 'payment', 'VNPay', 'Kích hoạt thanh toán VNPay', TRUE),
('payment_vnpay_merchant_id', '', 'text', 'payment', 'VNPay Merchant ID', 'Mã định danh merchant', FALSE),
('payment_vnpay_hash_secret', '', 'text', 'payment', 'VNPay Hash Secret', 'Mã bảo mật (hash secret)', FALSE),
('payment_vnpay_url', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', 'text', 'payment', 'VNPay URL', 'URL thanh toán VNPay', FALSE),
('payment_momo_enabled', 'false', 'boolean', 'payment', 'MoMo', 'Kích hoạt thanh toán MoMo', TRUE),
('payment_momo_partner_code', '', 'text', 'payment', 'MoMo Partner Code', 'Mã đối tác MoMo', FALSE),
('payment_momo_access_key', '', 'text', 'payment', 'MoMo Access Key', 'Access key MoMo', FALSE),
('payment_momo_secret_key', '', 'text', 'payment', 'MoMo Secret Key', 'Secret key MoMo', FALSE),
('payment_bank_transfer_enabled', 'true', 'boolean', 'payment', 'Chuyển khoản ngân hàng', 'Cho phép chuyển khoản', TRUE),
('payment_bank_name', 'Vietcombank', 'text', 'payment', 'Tên ngân hàng', 'Tên ngân hàng nhận chuyển khoản', TRUE),
('payment_bank_account_number', '1234567890', 'text', 'payment', 'Số tài khoản', 'Số tài khoản ngân hàng', TRUE),
('payment_bank_account_name', 'NGUYEN VAN A', 'text', 'payment', 'Tên tài khoản', 'Tên chủ tài khoản', TRUE),
('payment_bank_branch', 'Chi nhánh TP.HCM', 'text', 'payment', 'Chi nhánh', 'Chi nhánh ngân hàng', TRUE);

-- SHIPPING SETTINGS
INSERT INTO settings (setting_key, setting_value, setting_type, category, display_name, description, is_public) VALUES
('shipping_enabled', 'true', 'boolean', 'shipping', 'Kích hoạt vận chuyển', 'Bật/tắt tính năng vận chuyển', TRUE),
('shipping_fee_inner_city', '30000', 'number', 'shipping', 'Phí ship nội thành', 'Phí vận chuyển nội thành (VND)', TRUE),
('shipping_fee_suburban', '50000', 'number', 'shipping', 'Phí ship ngoại thành', 'Phí vận chuyển ngoại thành (VND)', TRUE),
('shipping_fee_province', '70000', 'number', 'shipping', 'Phí ship tỉnh khác', 'Phí vận chuyển tỉnh thành khác (VND)', TRUE),
('free_shipping_enabled', 'true', 'boolean', 'shipping', 'Miễn phí ship', 'Kích hoạt miễn phí ship khi đủ điều kiện', TRUE),
('free_shipping_threshold', '500000', 'number', 'shipping', 'Ngưỡng miễn phí ship', 'Giá trị đơn hàng tối thiểu để miễn phí ship (VND)', TRUE),
('weight_based_shipping', 'false', 'boolean', 'shipping', 'Tính phí theo cân nặng', 'Tính phí ship dựa trên trọng lượng', FALSE),
('shipping_zones', '{"inner_city":["Quận 1","Quận 2","Quận 3","Quận 7"],"suburban":["Bình Chánh","Hóc Môn"],"province":["Hà Nội","Đà Nẵng"]}', 'json', 'shipping', 'Khu vực vận chuyển', 'Cấu hình các khu vực ship', FALSE);

-- TAX SETTINGS
INSERT INTO settings (setting_key, setting_value, setting_type, category, display_name, description, is_public) VALUES
('tax_enabled', 'true', 'boolean', 'tax', 'Kích hoạt thuế', 'Bật/tắt tính thuế VAT', TRUE),
('tax_rate', '10', 'number', 'tax', 'Thuế suất (%)', 'Thuế suất VAT (%)', TRUE),
('tax_included_in_price', 'true', 'boolean', 'tax', 'Giá đã bao gồm thuế', 'Giá sản phẩm đã bao gồm thuế', TRUE),
('tax_display_mode', 'included', 'text', 'tax', 'Chế độ hiển thị thuế', 'included = giá đã gồm thuế, excluded = giá chưa gồm thuế', TRUE);

-- ADVANCED SETTINGS
INSERT INTO settings (setting_key, setting_value, setting_type, category, display_name, description, is_public) VALUES
('maintenance_mode', 'false', 'boolean', 'advanced', 'Chế độ bảo trì', 'Tạm khóa website để bảo trì', FALSE),
('maintenance_message', 'Website đang bảo trì, vui lòng quay lại sau.', 'text', 'advanced', 'Thông báo bảo trì', 'Thông báo hiển thị khi bảo trì', FALSE),
('products_per_page', '12', 'number', 'advanced', 'Số sản phẩm/trang', 'Số lượng sản phẩm hiển thị mỗi trang', TRUE),
('enable_reviews', 'true', 'boolean', 'advanced', 'Kích hoạt đánh giá', 'Cho phép khách hàng đánh giá sản phẩm', TRUE),
('auto_approve_reviews', 'false', 'boolean', 'advanced', 'Tự động duyệt đánh giá', 'Đánh giá tự động được hiển thị', FALSE);

-- =====================================================
-- Show inserted data
-- =====================================================
SELECT 
    category,
    COUNT(*) as total_settings
FROM settings
GROUP BY category
ORDER BY category;

SELECT * FROM settings ORDER BY category, setting_id;
