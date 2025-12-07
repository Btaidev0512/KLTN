-- 🏸 Script để tạo lại categories cho cửa hàng cầu lông
-- Chạy script này trong MySQL để thay thế categories cũ

USE ecommerce_db;

-- Backup categories cũ (optional)
-- CREATE TABLE categories_backup AS SELECT * FROM categories;

-- Xóa products liên kết (hoặc update category_id)
-- Cẩn thận: Điều này sẽ ảnh hưởng đến products hiện có
UPDATE products SET category_id = NULL WHERE category_id IS NOT NULL;

-- Xóa categories cũ
DELETE FROM categories;

-- Reset AUTO_INCREMENT
ALTER TABLE categories AUTO_INCREMENT = 1;

-- Thêm categories mới cho cửa hàng cầu lông
INSERT INTO categories (category_name, category_slug, description, parent_id, display_order, is_active) VALUES
-- Danh mục chính
('Vợt Cầu Lông', 'vot-cau-long', 'Vợt cầu lông chuyên nghiệp từ các thương hiệu hàng đầu', NULL, 1, 1),
('Giày Cầu Lông', 'giay-cau-long', 'Giày cầu lông chuyên dụng, chống trơn trượt', NULL, 2, 1),
('Cầu Lông', 'cau-long', 'Cầu lông thi đấu và tập luyện chất lượng cao', NULL, 3, 1),
('Phụ Kiện Cầu Lông', 'phu-kien-cau-long', 'Phụ kiện và dụng cụ hỗ trợ chơi cầu lông', NULL, 4, 1),
('Quần Áo Cầu Lông', 'quan-ao-cau-long', 'Trang phục thể thao chuyên dụng cho cầu lông', NULL, 5, 1),
('Túi Vợt', 'tui-vot', 'Balo và túi đựng vợt cầu lông', NULL, 6, 1);

-- Thêm sub-categories cho Vợt Cầu Lông
INSERT INTO categories (category_name, category_slug, description, parent_id, display_order, is_active) VALUES
('Vợt Tấn Công', 'vot-tan-cong', 'Vợt cầu lông thiên về tấn công, đập cầu mạnh', 1, 1, 1),
('Vợt Phòng Thủ', 'vot-phong-thu', 'Vợt cầu lông thiên về phòng thủ, kiểm soát tốt', 1, 2, 1),
('Vợt Cân Bằng', 'vot-can-bang', 'Vợt cầu lông cân bằng giữa tấn công và phòng thủ', 1, 3, 1);

-- Thêm sub-categories cho Giày Cầu Lông
INSERT INTO categories (category_name, category_slug, description, parent_id, display_order, is_active) VALUES
('Giày Nam', 'giay-nam', 'Giày cầu lông nam các size', 2, 1, 1),
('Giày Nữ', 'giay-nu', 'Giày cầu lông nữ các size', 2, 2, 1),
('Giày Trẻ Em', 'giay-tre-em', 'Giày cầu lông cho trẻ em', 2, 3, 1);

-- Thêm sub-categories cho Cầu Lông
INSERT INTO categories (category_name, category_slug, description, parent_id, display_order, is_active) VALUES
('Cầu Lông Nhựa', 'cau-long-nhua', 'Cầu lông nhựa bền, dùng tập luyện', 3, 1, 1),
('Cầu Lông Lông Vịt', 'cau-long-long-vit', 'Cầu lông lông vịt thi đấu chuyên nghiệp', 3, 2, 1);

-- Thêm sub-categories cho Phụ Kiện
INSERT INTO categories (category_name, category_slug, description, parent_id, display_order, is_active) VALUES
('Dây Cước Vợt', 'day-cuoc-vot', 'Dây cước vợt các loại', 4, 1, 1),
('Quấn Cán Vợt', 'quan-can-vot', 'Quấn cán vợt (grip) chống trơn', 4, 2, 1),
('Băng Bảo Vệ', 'bang-bao-ve', 'Băng cổ tay, băng đầu gối', 4, 3, 1),
('Lưới Cầu Lông', 'luoi-cau-long', 'Lưới thi đấu cầu lông', 4, 4, 1);

-- Verify
SELECT 
    c1.category_id,
    c1.category_name,
    c1.category_slug,
    c2.category_name as parent_category,
    c1.display_order,
    c1.is_active
FROM categories c1
LEFT JOIN categories c2 ON c1.parent_id = c2.category_id
ORDER BY c1.parent_id, c1.display_order;

-- Update existing products to new categories
-- Bạn cần map products cũ sang categories mới:

-- Ví dụ: Update products từ "Sports & Outdoors" sang "Vợt Cầu Lông"
-- UPDATE products 
-- SET category_id = 1 
-- WHERE product_name LIKE '%vợt%' OR product_name LIKE '%racket%';

-- UPDATE products 
-- SET category_id = 2 
-- WHERE product_name LIKE '%giày%' OR product_name LIKE '%shoe%';

-- UPDATE products 
-- SET category_id = 3 
-- WHERE product_name LIKE '%cầu%' OR product_name LIKE '%shuttlecock%';

-- UPDATE products 
-- SET category_id = 4 
-- WHERE product_name LIKE '%phụ kiện%' OR product_name LIKE '%grip%' OR product_name LIKE '%string%';

SELECT '✅ Categories cho cửa hàng cầu lông đã được tạo thành công!' as Status;
