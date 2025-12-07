-- Tạo database E-commerce
CREATE DATABASE IF NOT EXISTS `E-commerce` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `E-commerce`;

-- Tạo bảng users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    role ENUM('admin', 'customer') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm admin user mặc định
INSERT INTO users (email, password, full_name, role) VALUES 
('admin@ecommerce.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMhBG6.c1qeWYBG', 'Administrator', 'admin')
ON DUPLICATE KEY UPDATE email = email;

-- Kiểm tra dữ liệu
SELECT 'Database E-commerce created successfully!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT * FROM users WHERE role = 'admin';