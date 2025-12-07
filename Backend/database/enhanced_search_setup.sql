-- 🔍 ENHANCED SEARCH DATABASE SETUP - PHASE 1
-- Create search analytics table for tracking

CREATE TABLE IF NOT EXISTS search_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    query VARCHAR(255) NOT NULL,
    user_id INT NULL,
    result_count INT DEFAULT 0,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_query (query),
    INDEX idx_user_id (user_id),
    INDEX idx_searched_at (searched_at),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Add FULLTEXT indexes for enhanced search performance
-- Check if FULLTEXT index exists first, then add if not present

-- For products table - full text search
ALTER TABLE products ADD FULLTEXT(name, description, tags);

-- Add indexes for faceted search performance
CREATE INDEX IF NOT EXISTS idx_products_category_price ON products(category_id, price);
CREATE INDEX IF NOT EXISTS idx_products_brand_price ON products(brand_id, price);
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);

-- Add indexes for reviews aggregation
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);

-- Insert some sample search data for testing
INSERT IGNORE INTO search_analytics (query, user_id, result_count, searched_at) VALUES
('giày thể thao', 1, 15, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('áo khoác', 2, 8, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('laptop gaming', 1, 12, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('iPhone', 3, 5, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('túi xách', 2, 20, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('đồng hồ', 1, 10, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('nike', 3, 25, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('adidas', 1, 18, DATE_SUB(NOW(), INTERVAL 8 DAY)),
('samsung', 2, 7, DATE_SUB(NOW(), INTERVAL 9 DAY)),
('macbook', 3, 4, DATE_SUB(NOW(), INTERVAL 10 DAY));

-- Add some search-friendly tags to existing products if tags column is empty
UPDATE products SET tags = CONCAT(
    COALESCE(tags, ''), 
    IF(tags IS NULL OR tags = '', '', ', '),
    name, ', ', 
    (SELECT name FROM categories WHERE categories.category_id = products.category_id), ', ',
    (SELECT name FROM brands WHERE brands.brand_id = products.brand_id)
) WHERE tags IS NULL OR tags = '';

-- Sample update for better search tags (customize based on your products)
UPDATE products SET tags = 'thể thao, chạy bộ, Nike, sneakers, giày nam, giày nữ' 
WHERE name LIKE '%giày%' AND brand_id = (SELECT brand_id FROM brands WHERE name = 'Nike' LIMIT 1);

UPDATE products SET tags = 'thời trang, casual, Adidas, sneakers, giày thể thao' 
WHERE name LIKE '%giày%' AND brand_id = (SELECT brand_id FROM brands WHERE name = 'Adidas' LIMIT 1);

UPDATE products SET tags = 'công nghệ, smartphone, Apple, iOS, điện thoại thông minh' 
WHERE name LIKE '%iPhone%';

UPDATE products SET tags = 'công nghệ, laptop, gaming, máy tính xách tay, Dell, HP, Asus' 
WHERE name LIKE '%laptop%';

-- Create a view for popular search terms (optional, for easier analytics)
CREATE OR REPLACE VIEW popular_searches AS
SELECT 
    query,
    COUNT(*) as search_count,
    AVG(result_count) as avg_results,
    MAX(searched_at) as last_searched,
    COUNT(DISTINCT user_id) as unique_users
FROM search_analytics 
WHERE searched_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY query
HAVING search_count > 1
ORDER BY search_count DESC;

-- Create index for better search analytics performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_query_date ON search_analytics(query, searched_at);
CREATE INDEX IF NOT EXISTS idx_search_analytics_results ON search_analytics(result_count);