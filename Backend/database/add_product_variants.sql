-- =====================================================
-- PRODUCT VARIANTS TABLE (Color × Size)
-- Quản lý tồn kho chi tiết theo màu và size
-- =====================================================

USE ecommerce_db;

-- Bảng product_variants: Mỗi dòng = 1 SKU duy nhất (Màu + Size)
CREATE TABLE IF NOT EXISTS product_variants (
    variant_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL COMMENT 'Sản phẩm gốc',
    color_id INT NOT NULL COMMENT 'Màu của variant này',
    
    -- Thông tin size & SKU
    size VARCHAR(20) NOT NULL COMMENT 'Size: 39, 40, 41, 42...',
    sku VARCHAR(100) UNIQUE NOT NULL COMMENT 'Mã SKU duy nhất: VD LN-RED-42',
    
    -- Quản lý giá & tồn kho
    stock_quantity INT DEFAULT 0 COMMENT 'Số lượng còn trong kho',
    price_override DECIMAL(12,2) NULL COMMENT 'Giá riêng (nếu khác giá gốc)',
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Còn bán hay không',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES product_colors(color_id) ON DELETE CASCADE,
    
    -- Indexes để tìm kiếm nhanh
    INDEX idx_product_variants_product (product_id),
    INDEX idx_product_variants_color (color_id),
    INDEX idx_product_variants_sku (sku),
    INDEX idx_product_variants_active (is_active),
    
    -- Unique constraint: 1 product chỉ có 1 variant với (color + size)
    UNIQUE KEY unique_color_size (product_id, color_id, size)
);

-- =====================================================
-- Thêm primary_image_id vào product_colors
-- Mỗi màu có thumbnail riêng
-- =====================================================

ALTER TABLE product_colors 
ADD COLUMN primary_image_id INT NULL COMMENT 'Ảnh đại diện của màu này',
ADD INDEX idx_product_colors_primary_image (primary_image_id);

-- Optional: Foreign key nếu muốn ràng buộc chặt
-- ALTER TABLE product_colors 
-- ADD FOREIGN KEY (primary_image_id) REFERENCES product_images(image_id) ON DELETE SET NULL;

-- =====================================================
-- Optional: Thêm fields cho Video & 360 view
-- =====================================================

ALTER TABLE products
ADD COLUMN video_url VARCHAR(255) NULL COMMENT 'URL video giới thiệu sản phẩm',
ADD COLUMN view_360_url VARCHAR(255) NULL COMMENT 'URL ảnh 360 độ';

-- Hoặc thêm vào product_colors nếu mỗi màu có video riêng:
ALTER TABLE product_colors
ADD COLUMN video_url VARCHAR(255) NULL COMMENT 'Video của màu này',
ADD COLUMN view_360_url VARCHAR(255) NULL COMMENT '360 view của màu này';

-- =====================================================
-- DEMO DATA - Test với sản phẩm ID 1
-- =====================================================

-- Đảm bảo product ID 1 tồn tại và có màu trước
-- Bỏ qua phần demo data nếu chưa có sản phẩm

-- Nếu muốn test, uncomment các dòng dưới SAU KHI đã có product_id = 1 và colors:

/*
-- Tạo variants cho Màu Đỏ (color_id = 1)
INSERT INTO product_variants (product_id, color_id, size, sku, stock_quantity, price_override) VALUES
(1, 1, '39', 'LN-RED-39', 5, NULL),
(1, 1, '40', 'LN-RED-40', 8, NULL),
(1, 1, '41', 'LN-RED-41', 12, NULL),
(1, 1, '42', 'LN-RED-42', 10, NULL),
(1, 1, '43', 'LN-RED-43', 3, NULL);

-- Tạo variants cho Màu Xanh (color_id = 2)
INSERT INTO product_variants (product_id, color_id, size, sku, stock_quantity, price_override) VALUES
(1, 2, '39', 'LN-BLUE-39', 0, NULL),
(1, 2, '40', 'LN-BLUE-40', 6, NULL),
(1, 2, '41', 'LN-BLUE-41', 8, NULL),
(1, 2, '42', 'LN-BLUE-42', 15, NULL),
(1, 2, '43', 'LN-BLUE-43', 5, NULL);

-- Tạo variants cho Màu Trắng (color_id = 3)
INSERT INTO product_variants (product_id, color_id, size, sku, stock_quantity, price_override) VALUES
(1, 3, '39', 'LN-WHITE-39', 10, NULL),
(1, 3, '40', 'LN-WHITE-40', 0, NULL),
(1, 3, '41', 'LN-WHITE-41', 7, NULL),
(1, 3, '42', 'LN-WHITE-42', 12, NULL),
(1, 3, '43', 'LN-WHITE-43', 8, 950000);
*/

-- =====================================================
-- VERIFY DATA
-- =====================================================

-- Kiểm tra variants đã tạo
SELECT 
    v.variant_id,
    p.product_name,
    c.color_name,
    v.size,
    v.sku,
    v.stock_quantity,
    COALESCE(v.price_override, p.base_price) as final_price
FROM product_variants v
JOIN products p ON v.product_id = p.product_id
JOIN product_colors c ON v.color_id = c.color_id
WHERE v.product_id = 1
ORDER BY c.color_id, v.size;

-- Tính tổng stock theo màu
SELECT 
    c.color_name,
    c.color_code,
    SUM(v.stock_quantity) as total_stock,
    COUNT(DISTINCT v.size) as available_sizes
FROM product_colors c
LEFT JOIN product_variants v ON c.color_id = v.color_id
WHERE c.product_id = 1
GROUP BY c.color_id, c.color_name, c.color_code;

-- Kiểm tra size nào còn hàng của màu Đỏ
SELECT 
    size,
    sku,
    stock_quantity,
    CASE 
        WHEN stock_quantity > 0 THEN 'Còn hàng'
        ELSE 'Hết hàng'
    END as status
FROM product_variants
WHERE product_id = 1 AND color_id = 1
ORDER BY size;
