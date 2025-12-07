-- ==========================================
-- 📦 Bảng quản lý biến thể sản phẩm (Size + Stock)
-- Đơn giản: Chỉ Size + Số lượng (KHÔNG có màu sắc)
-- ==========================================

-- Xóa bảng cũ nếu tồn tại (cẩn thận!)
DROP TABLE IF EXISTS product_variants;

CREATE TABLE product_variants (
  variant_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  size VARCHAR(20) NOT NULL COMMENT 'Size: 36, 39, 41, S, M, L, XL, 2XL, 3U, 4U, 5U',
  stock_quantity INT NOT NULL DEFAULT 0 COMMENT 'Số lượng tồn kho của size này',
  sku VARCHAR(100) NULL COMMENT 'Mã SKU riêng cho từng size (optional)',
  is_active TINYINT(1) DEFAULT 1 COMMENT '1=Còn bán, 0=Ngừng bán',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_size (product_id, size),
  INDEX idx_product_stock (product_id, stock_quantity),
  INDEX idx_size (size)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 📊 Dữ liệu mẫu test
-- ==========================================

-- Ví dụ: Giày Yonex Aerus Z Wide (product_id = 22)
INSERT INTO product_variants (product_id, size, stock_quantity) VALUES
(22, '36', 5),
(22, '39', 5),
(22, '41', 10);

-- Cập nhật tổng kho trong products (thủ công vì không dùng trigger)
UPDATE products SET stock_quantity = 20 WHERE product_id = 22;

SELECT 'Table product_variants created successfully!' as Status;
