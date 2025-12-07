-- Product Attributes System
-- Hệ thống attributes linh hoạt cho từng loại sản phẩm

-- Bảng định nghĩa các loại attributes (ví dụ: Độ cứng, Lối chơi, Trọng lượng)
CREATE TABLE IF NOT EXISTS attribute_definitions (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    attribute_name VARCHAR(100) NOT NULL COMMENT 'Tên thuộc tính (VD: Độ cứng)',
    attribute_key VARCHAR(50) NOT NULL COMMENT 'Key để filter (VD: shaft_flex)',
    attribute_type ENUM('select', 'multiselect', 'range', 'text') DEFAULT 'select' COMMENT 'Loại input',
    is_filterable TINYINT(1) DEFAULT 1 COMMENT 'Có thể dùng để lọc',
    is_required TINYINT(1) DEFAULT 0 COMMENT 'Bắt buộc khi tạo sản phẩm',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_key (category_id, attribute_key),
    INDEX idx_category (category_id),
    INDEX idx_filterable (is_filterable)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng các giá trị có thể có của mỗi attribute (VD: Cứng, Trung bình, Mềm)
CREATE TABLE IF NOT EXISTS attribute_values (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_id INT NOT NULL,
    value_name VARCHAR(100) NOT NULL COMMENT 'Tên giá trị hiển thị',
    value_key VARCHAR(50) NOT NULL COMMENT 'Key để filter',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attribute_id) REFERENCES attribute_definitions(attribute_id) ON DELETE CASCADE,
    UNIQUE KEY unique_attribute_value (attribute_id, value_key),
    INDEX idx_attribute (attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng lưu giá trị attributes của từng sản phẩm
DROP TABLE IF EXISTS product_attributes;
CREATE TABLE product_attributes (
    product_attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_id INT NULL COMMENT 'NULL nếu là text tự do',
    custom_value TEXT NULL COMMENT 'Giá trị tự do nếu không dùng value_id',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attribute_definitions(attribute_id) ON DELETE CASCADE,
    FOREIGN KEY (value_id) REFERENCES attribute_values(value_id) ON DELETE SET NULL,
    UNIQUE KEY unique_product_attribute (product_id, attribute_id),
    INDEX idx_product (product_id),
    INDEX idx_attribute (attribute_id),
    INDEX idx_value (value_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert attributes cho Vợt cầu lông (category_id = 5 theo query trước)
INSERT INTO attribute_definitions (category_id, attribute_name, attribute_key, attribute_type, is_filterable, is_required, display_order) VALUES
(5, 'Thương hiệu', 'brand', 'select', 1, 1, 1),
(5, 'Dòng vợt', 'series', 'select', 1, 0, 2),
(5, 'Độ cứng', 'shaft_flex', 'select', 1, 1, 3),
(5, 'Lối chơi', 'play_style', 'multiselect', 1, 1, 4),
(5, 'Trọng lượng', 'weight', 'select', 1, 1, 5),
(5, 'Điểm cân bằng', 'balance_point', 'select', 1, 0, 6);

-- Giá trị cho "Độ cứng" (shaft_flex)
INSERT INTO attribute_values (attribute_id, value_name, value_key, display_order) 
SELECT attribute_id, 'Cứng', 'stiff', 1 FROM attribute_definitions WHERE attribute_key = 'shaft_flex' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Trung bình cứng', 'medium_stiff', 2 FROM attribute_definitions WHERE attribute_key = 'shaft_flex' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Trung bình', 'medium', 3 FROM attribute_definitions WHERE attribute_key = 'shaft_flex' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Trung bình mềm', 'medium_flex', 4 FROM attribute_definitions WHERE attribute_key = 'shaft_flex' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Mềm', 'flexible', 5 FROM attribute_definitions WHERE attribute_key = 'shaft_flex' AND category_id = 5;

-- Giá trị cho "Lối chơi" (play_style)
INSERT INTO attribute_values (attribute_id, value_name, value_key, display_order)
SELECT attribute_id, 'Tấn công', 'offensive', 1 FROM attribute_definitions WHERE attribute_key = 'play_style' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Phòng thủ', 'defensive', 2 FROM attribute_definitions WHERE attribute_key = 'play_style' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Cân bằng', 'balanced', 3 FROM attribute_definitions WHERE attribute_key = 'play_style' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Toàn diện', 'all_around', 4 FROM attribute_definitions WHERE attribute_key = 'play_style' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Kiểm soát', 'control', 5 FROM attribute_definitions WHERE attribute_key = 'play_style' AND category_id = 5;

-- Giá trị cho "Trọng lượng" (weight)
INSERT INTO attribute_values (attribute_id, value_name, value_key, display_order)
SELECT attribute_id, '2U (90-94g)', '2u', 1 FROM attribute_definitions WHERE attribute_key = 'weight' AND category_id = 5
UNION ALL
SELECT attribute_id, '3U (85-89g)', '3u', 2 FROM attribute_definitions WHERE attribute_key = 'weight' AND category_id = 5
UNION ALL
SELECT attribute_id, '4U (80-84g)', '4u', 3 FROM attribute_definitions WHERE attribute_key = 'weight' AND category_id = 5
UNION ALL
SELECT attribute_id, '5U (75-79g)', '5u', 4 FROM attribute_definitions WHERE attribute_key = 'weight' AND category_id = 5
UNION ALL
SELECT attribute_id, '6U (70-74g)', '6u', 5 FROM attribute_definitions WHERE attribute_key = 'weight' AND category_id = 5;

-- Giá trị cho "Điểm cân bằng" (balance_point)
INSERT INTO attribute_values (attribute_id, value_name, value_key, display_order)
SELECT attribute_id, 'Đầu nặng', 'head_heavy', 1 FROM attribute_definitions WHERE attribute_key = 'balance_point' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Cân bằng', 'even_balance', 2 FROM attribute_definitions WHERE attribute_key = 'balance_point' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Cán nặng', 'head_light', 3 FROM attribute_definitions WHERE attribute_key = 'balance_point' AND category_id = 5;

-- Giá trị cho "Dòng vợt" (series) - sẽ được cập nhật theo từng thương hiệu
-- VD cho Yonex:
INSERT INTO attribute_values (attribute_id, value_name, value_key, display_order)
SELECT attribute_id, 'Astrox', 'astrox', 1 FROM attribute_definitions WHERE attribute_key = 'series' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Nanoflare', 'nanoflare', 2 FROM attribute_definitions WHERE attribute_key = 'series' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Arcsaber', 'arcsaber', 3 FROM attribute_definitions WHERE attribute_key = 'series' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Voltric', 'voltric', 4 FROM attribute_definitions WHERE attribute_key = 'series' AND category_id = 5
UNION ALL
SELECT attribute_id, 'Duora', 'duora', 5 FROM attribute_definitions WHERE attribute_key = 'series' AND category_id = 5;
