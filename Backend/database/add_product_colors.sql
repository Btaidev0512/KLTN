-- =====================================================
-- PRODUCT COLORS TABLE
-- Quản lý màu sắc cho sản phẩm
-- =====================================================

CREATE TABLE IF NOT EXISTS product_colors (
    color_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    color_name VARCHAR(50) NOT NULL,
    color_code VARCHAR(10) NOT NULL COMMENT 'Mã màu hex #FFFFFF',
    stock_quantity INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product_colors_product (product_id),
    INDEX idx_product_colors_active (is_active)
);

-- =====================================================
-- Thêm cột color_id vào product_images
-- =====================================================

ALTER TABLE product_images 
ADD COLUMN color_id INT NULL COMMENT 'Ảnh thuộc màu nào',
ADD INDEX idx_product_images_color (color_id);

-- Thêm foreign key (nếu muốn ràng buộc)
-- ALTER TABLE product_images 
-- ADD FOREIGN KEY (color_id) REFERENCES product_colors(color_id) ON DELETE SET NULL;

-- =====================================================
-- Demo data cho giày
-- =====================================================

-- Ví dụ: Product ID 1 là giày có 3 màu
INSERT INTO product_colors (product_id, color_name, color_code, stock_quantity, sort_order) VALUES
(1, 'Đỏ', '#FF0000', 10, 1),
(1, 'Xanh dương', '#0000FF', 5, 2),
(1, 'Trắng', '#FFFFFF', 8, 3);

-- Demo: Gán ảnh cho màu (giả sử đã có ảnh trong product_images)
-- UPDATE product_images SET color_id = 1 WHERE image_id IN (1, 2);
-- UPDATE product_images SET color_id = 2 WHERE image_id IN (3, 4);
-- UPDATE product_images SET color_id = 3 WHERE image_id IN (5, 6);
