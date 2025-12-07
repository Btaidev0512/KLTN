-- =====================================================
-- COMPLETE E-COMMERCE DATABASE CREATION SCRIPT
-- Recreated based on provided schema
-- =====================================================

-- Drop database if exists and recreate
DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_db;

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Vietnam',
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    role ENUM('admin', 'customer') DEFAULT 'customer',
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    remember_token VARCHAR(100),
    reset_token VARCHAR(100),
    reset_token_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
);

-- =====================================================
-- 2. CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    category_slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    parent_id INT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_slug (category_slug),
    INDEX idx_categories_active (is_active),
    INDEX idx_categories_sort (sort_order)
);

-- =====================================================
-- 3. BRANDS TABLE
-- =====================================================
CREATE TABLE brands (
    brand_id INT PRIMARY KEY AUTO_INCREMENT,
    brand_name VARCHAR(100) NOT NULL,
    brand_slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(255),
    website_url VARCHAR(255),
    country VARCHAR(50),
    established_year YEAR,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_brands_slug (brand_slug),
    INDEX idx_brands_active (is_active),
    INDEX idx_brands_sort (sort_order)
);

-- =====================================================
-- 4. PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(255) NOT NULL,
    product_slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    category_id INT NOT NULL,
    brand_id INT NOT NULL,
    base_price DECIMAL(12,2) NOT NULL,
    sale_price DECIMAL(12,2),
    cost_price DECIMAL(12,2),
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    weight DECIMAL(8,2),
    dimensions VARCHAR(100),
    materials TEXT,
    care_instructions TEXT,
    status ENUM('active', 'inactive', 'out_of_stock', 'discontinued') DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    is_digital BOOLEAN DEFAULT FALSE,
    track_quantity BOOLEAN DEFAULT TRUE,
    continue_selling_when_out_of_stock BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    view_count INT DEFAULT 0,
    purchase_count INT DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE RESTRICT,
    INDEX idx_products_category (category_id),
    INDEX idx_products_brand (brand_id),
    INDEX idx_products_status (status),
    INDEX idx_products_featured (featured),
    INDEX idx_products_slug (product_slug),
    INDEX idx_products_price (base_price),
    INDEX idx_products_rating (rating_average),
    INDEX idx_products_created (created_at),
    FULLTEXT idx_products_search (product_name, description, short_description)
);

-- =====================================================
-- 5. PRODUCT_IMAGES TABLE
-- =====================================================
CREATE TABLE product_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    image_path VARCHAR(255),
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    file_size INT,
    width INT,
    height INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product_images_product (product_id),
    INDEX idx_product_images_primary (is_primary),
    INDEX idx_product_images_sort (sort_order)
);

-- =====================================================
-- 6. PRODUCT_VARIANTS TABLE
-- =====================================================
CREATE TABLE product_variants (
    variant_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    size VARCHAR(20),
    color VARCHAR(50),
    material VARCHAR(50),
    style VARCHAR(50),
    price DECIMAL(12,2),
    sale_price DECIMAL(12,2),
    cost_price DECIMAL(12,2),
    stock_quantity INT DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    weight DECIMAL(8,2),
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product_variants_product (product_id),
    INDEX idx_product_variants_sku (sku),
    INDEX idx_product_variants_active (is_active),
    INDEX idx_product_variants_stock (stock_quantity)
);

-- =====================================================
-- 7. PRODUCT_CATEGORIES TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE product_categories (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- =====================================================
-- 8. CARTS TABLE
-- =====================================================
CREATE TABLE carts (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    session_id VARCHAR(255),
    total_items INT DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_carts_user (user_id),
    INDEX idx_carts_session (session_id),
    INDEX idx_carts_expires (expires_at)
);

-- =====================================================
-- 9. CART_ITEMS TABLE
-- =====================================================
CREATE TABLE cart_items (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    INDEX idx_cart_items_cart (cart_id),
    INDEX idx_cart_items_product (product_id),
    UNIQUE KEY unique_cart_product_variant (cart_id, product_id, variant_id)
);

-- =====================================================
-- 10. COUPONS TABLE
-- =====================================================
CREATE TABLE coupons (
    coupon_id INT PRIMARY KEY AUTO_INCREMENT,
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    coupon_name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed_amount', 'free_shipping') NOT NULL,
    discount_value DECIMAL(12,2) NOT NULL,
    minimum_order_amount DECIMAL(12,2) DEFAULT 0,
    maximum_discount_amount DECIMAL(12,2),
    usage_limit_per_coupon INT,
    usage_limit_per_customer INT DEFAULT 1,
    used_count INT DEFAULT 0,
    applies_to ENUM('all', 'specific_products', 'specific_categories') DEFAULT 'all',
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_coupons_code (coupon_code),
    INDEX idx_coupons_active (is_active),
    INDEX idx_coupons_valid (valid_from, valid_until),
    INDEX idx_coupons_type (discount_type)
);

-- =====================================================
-- 11. ORDERS TABLE
-- =====================================================
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded') DEFAULT 'pending',
    fulfillment_status ENUM('unfulfilled', 'partial', 'fulfilled') DEFAULT 'unfulfilled',
    payment_method ENUM('cod', 'vnpay', 'momo', 'zalopay', 'bank_transfer', 'credit_card'),
    payment_reference VARCHAR(255),
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_cost DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Coupon
    coupon_id INT,
    coupon_code VARCHAR(50),
    
    -- Customer info
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    
    -- Shipping address
    shipping_full_name VARCHAR(100) NOT NULL,
    shipping_company VARCHAR(100),
    shipping_address_line_1 VARCHAR(255) NOT NULL,
    shipping_address_line_2 VARCHAR(255),
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(50) NOT NULL,
    
    -- Billing address
    billing_full_name VARCHAR(100),
    billing_company VARCHAR(100),
    billing_address_line_1 VARCHAR(255),
    billing_address_line_2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(50),
    
    -- Additional info
    notes TEXT,
    admin_notes TEXT,
    
    -- Tracking
    tracking_number VARCHAR(255),
    carrier VARCHAR(100),
    
    -- Important dates
    confirmed_at DATETIME,
    shipped_at DATETIME,
    delivered_at DATETIME,
    cancelled_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE SET NULL,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_payment_status (payment_status),
    INDEX idx_orders_number (order_number),
    INDEX idx_orders_created (created_at),
    INDEX idx_orders_email (customer_email)
);

-- =====================================================
-- 12. ORDER_ITEMS TABLE
-- =====================================================
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    
    -- Product details (snapshot at time of order)
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(100),
    sku VARCHAR(100) NOT NULL,
    
    -- Pricing
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    
    -- Fulfillment
    fulfillment_status ENUM('unfulfilled', 'fulfilled', 'returned') DEFAULT 'unfulfilled',
    fulfilled_quantity INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
);

-- =====================================================
-- 13. REVIEWS TABLE
-- =====================================================
CREATE TABLE reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT,
    order_item_id INT,
    
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    
    -- Review images
    images JSON,
    
    -- Moderation
    is_verified BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    admin_response TEXT,
    
    -- Engagement
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id) ON DELETE SET NULL,
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_user (user_id),
    INDEX idx_reviews_rating (rating),
    INDEX idx_reviews_approved (is_approved),
    UNIQUE KEY unique_user_product_order (user_id, product_id, order_id)
);

-- =====================================================
-- 14. WISHLISTS TABLE
-- =====================================================
CREATE TABLE wishlists (
    wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    INDEX idx_wishlists_user (user_id),
    INDEX idx_wishlists_product (product_id),
    UNIQUE KEY unique_user_product_variant (user_id, product_id, variant_id)
);

-- =====================================================
-- 15. INVENTORY_TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE inventory_transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    variant_id INT NOT NULL,
    transaction_type ENUM('purchase', 'sale', 'adjustment', 'return') NOT NULL,
    quantity_change INT NOT NULL,
    quantity_after INT NOT NULL,
    reference_id INT, -- order_id for sales, etc.
    reference_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    INDEX idx_inventory_variant (variant_id),
    INDEX idx_inventory_type (transaction_type),
    INDEX idx_inventory_created (created_at)
);

-- =====================================================
-- 16. PRODUCT_ATTRIBUTES TABLE
-- =====================================================
CREATE TABLE product_attributes (
    attribute_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product_attributes_product (product_id),
    INDEX idx_product_attributes_name (attribute_name)
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC CALCULATIONS
-- =====================================================

-- Update product rating when review is added/updated
DELIMITER //
CREATE TRIGGER update_product_rating_after_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
BEGIN
    UPDATE products SET 
        rating_average = (
            SELECT AVG(rating) 
            FROM reviews 
            WHERE product_id = NEW.product_id AND is_approved = TRUE
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE product_id = NEW.product_id AND is_approved = TRUE
        )
    WHERE product_id = NEW.product_id;
END//

CREATE TRIGGER update_product_rating_after_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
BEGIN
    UPDATE products SET 
        rating_average = (
            SELECT AVG(rating) 
            FROM reviews 
            WHERE product_id = NEW.product_id AND is_approved = TRUE
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE product_id = NEW.product_id AND is_approved = TRUE
        )
    WHERE product_id = NEW.product_id;
END//

-- Update cart totals when cart items change
CREATE TRIGGER update_cart_totals_after_cart_item_insert
    AFTER INSERT ON cart_items
    FOR EACH ROW
BEGIN
    UPDATE carts SET 
        total_items = (SELECT SUM(quantity) FROM cart_items WHERE cart_id = NEW.cart_id),
        total_amount = (SELECT SUM(total_price) FROM cart_items WHERE cart_id = NEW.cart_id)
    WHERE cart_id = NEW.cart_id;
END//

CREATE TRIGGER update_cart_totals_after_cart_item_update
    AFTER UPDATE ON cart_items
    FOR EACH ROW
BEGIN
    UPDATE carts SET 
        total_items = (SELECT SUM(quantity) FROM cart_items WHERE cart_id = NEW.cart_id),
        total_amount = (SELECT SUM(total_price) FROM cart_items WHERE cart_id = NEW.cart_id)
    WHERE cart_id = NEW.cart_id;
END//

CREATE TRIGGER update_cart_totals_after_cart_item_delete
    AFTER DELETE ON cart_items
    FOR EACH ROW
BEGIN
    UPDATE carts SET 
        total_items = COALESCE((SELECT SUM(quantity) FROM cart_items WHERE cart_id = OLD.cart_id), 0),
        total_amount = COALESCE((SELECT SUM(total_price) FROM cart_items WHERE cart_id = OLD.cart_id), 0)
    WHERE cart_id = OLD.cart_id;
END//

DELIMITER ;

-- =====================================================
-- INSERT INITIAL DATA
-- =====================================================

-- Admin user
INSERT INTO users (username, email, password, full_name, role, is_active) VALUES
('admin', 'admin@admin.com', '$2b$10$2EE9l5lZ5YCOyMNlUQJzKeQJYYOWjWJO5V0rJwVrKDdJ5F7CfhqHW', 'System Administrator', 'admin', TRUE);

-- Sample categories
INSERT INTO categories (category_name, category_slug, description) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories'),
('Clothing', 'clothing', 'Fashion and apparel'),
('Books', 'books', 'Books and educational materials'),
('Home & Garden', 'home-garden', 'Home improvement and gardening supplies');

-- Sample brands
INSERT INTO brands (brand_name, brand_slug, description, country) VALUES
('Apple', 'apple', 'Technology company', 'USA'),
('Samsung', 'samsung', 'Electronics manufacturer', 'South Korea'),
('Nike', 'nike', 'Sports apparel and equipment', 'USA'),
('H&M', 'hm', 'Fashion retailer', 'Sweden');

-- =====================================================
-- SCRIPT COMPLETION MESSAGE
-- =====================================================
SELECT 'Database ecommerce_db has been created successfully!' as Status;
SELECT 'Total tables created: ' as Info, COUNT(*) as Count FROM information_schema.tables WHERE table_schema = 'ecommerce_db';