-- Tạo bảng trung gian để 1 brand có thể thuộc nhiều categories
CREATE TABLE IF NOT EXISTS brand_categories (
    brand_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (brand_id, category_id),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
    INDEX idx_brand (brand_id),
    INDEX idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing data từ brands.category_id sang brand_categories
INSERT INTO brand_categories (brand_id, category_id)
SELECT brand_id, category_id
FROM brands
WHERE category_id IS NOT NULL
ON DUPLICATE KEY UPDATE brand_id = brand_id;

-- Comment: Giữ lại column brands.category_id để backward compatibility
-- Có thể xóa sau khi test xong: ALTER TABLE brands DROP COLUMN category_id;
