const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeSettingsTable() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ecommerce_db',
        });

        console.log('✅ Connected to database');

        // Check if settings table exists
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'settings'"
        );

        if (tables.length > 0) {
            console.log('⚠️  Settings table already exists');
            
            // Ask if want to recreate
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise((resolve) => {
                readline.question('Do you want to recreate the table? (yes/no): ', resolve);
            });
            
            readline.close();

            if (answer.toLowerCase() !== 'yes') {
                console.log('❌ Aborted');
                await connection.end();
                return;
            }

            // Drop table
            await connection.execute('DROP TABLE IF EXISTS settings');
            console.log('🗑️  Dropped existing settings table');
        }

        // Create settings table
        const createTableSQL = `
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
        `;

        await connection.execute(createTableSQL);
        console.log('✅ Created settings table');

        // Insert default settings
        const defaultSettings = [
            // GENERAL SETTINGS
            ['shop_name', 'Cửa hàng cầu lông ABC', 'text', 'general', 'Tên cửa hàng', 'Tên hiển thị của cửa hàng', true],
            ['shop_tagline', 'Chuyên cung cấp thiết bị cầu lông chính hãng', 'text', 'general', 'Slogan', 'Slogan của cửa hàng', true],
            ['contact_email', 'shop@badminton.com', 'text', 'general', 'Email liên hệ', 'Email chính để liên hệ', true],
            ['contact_phone', '0901234567', 'text', 'general', 'Số điện thoại', 'Số điện thoại liên hệ', true],
            ['shop_address', '123 Nguyễn Văn Linh, Quận 7, TP.HCM', 'text', 'general', 'Địa chỉ', 'Địa chỉ cửa hàng', true],
            ['website_url', 'https://badminton-shop.com', 'text', 'general', 'Website URL', 'URL chính của website', true],
            ['currency', 'VND', 'text', 'general', 'Đơn vị tiền tệ', 'Đơn vị tiền tệ sử dụng', true],

            // PAYMENT SETTINGS
            ['payment_cod_enabled', 'true', 'boolean', 'payment', 'COD (Ship COD)', 'Cho phép thanh toán khi nhận hàng', true],
            ['payment_vnpay_enabled', 'false', 'boolean', 'payment', 'VNPay', 'Kích hoạt thanh toán VNPay', true],
            ['payment_vnpay_merchant_id', '', 'text', 'payment', 'VNPay Merchant ID', 'Mã định danh merchant', false],
            ['payment_momo_enabled', 'false', 'boolean', 'payment', 'MoMo', 'Kích hoạt thanh toán MoMo', true],
            ['payment_bank_transfer_enabled', 'true', 'boolean', 'payment', 'Chuyển khoản ngân hàng', 'Cho phép chuyển khoản', true],
            ['payment_bank_name', 'Vietcombank', 'text', 'payment', 'Tên ngân hàng', 'Tên ngân hàng nhận chuyển khoản', true],
            ['payment_bank_account_number', '1234567890', 'text', 'payment', 'Số tài khoản', 'Số tài khoản ngân hàng', true],
            ['payment_bank_account_name', 'NGUYEN VAN A', 'text', 'payment', 'Tên tài khoản', 'Tên chủ tài khoản', true],
            ['payment_bank_branch', 'Chi nhánh TP.HCM', 'text', 'payment', 'Chi nhánh', 'Chi nhánh ngân hàng', true],

            // SHIPPING SETTINGS
            ['shipping_enabled', 'true', 'boolean', 'shipping', 'Kích hoạt vận chuyển', 'Bật/tắt tính năng vận chuyển', true],
            ['shipping_fee_inner_city', '30000', 'number', 'shipping', 'Phí ship nội thành', 'Phí vận chuyển nội thành (VND)', true],
            ['shipping_fee_suburban', '50000', 'number', 'shipping', 'Phí ship ngoại thành', 'Phí vận chuyển ngoại thành (VND)', true],
            ['shipping_fee_province', '70000', 'number', 'shipping', 'Phí ship tỉnh khác', 'Phí vận chuyển tỉnh thành khác (VND)', true],
            ['free_shipping_enabled', 'true', 'boolean', 'shipping', 'Miễn phí ship', 'Kích hoạt miễn phí ship khi đủ điều kiện', true],
            ['free_shipping_threshold', '500000', 'number', 'shipping', 'Ngưỡng miễn phí ship', 'Giá trị đơn hàng tối thiểu để miễn phí ship (VND)', true],

            // TAX SETTINGS
            ['tax_enabled', 'true', 'boolean', 'tax', 'Kích hoạt thuế', 'Bật/tắt tính thuế VAT', true],
            ['tax_rate', '10', 'number', 'tax', 'Thuế suất (%)', 'Thuế suất VAT (%)', true],
            ['tax_included_in_price', 'true', 'boolean', 'tax', 'Giá đã bao gồm thuế', 'Giá sản phẩm đã bao gồm thuế', true],

            // ADVANCED SETTINGS
            ['maintenance_mode', 'false', 'boolean', 'advanced', 'Chế độ bảo trì', 'Tạm khóa website để bảo trì', false],
            ['products_per_page', '12', 'number', 'advanced', 'Số sản phẩm/trang', 'Số lượng sản phẩm hiển thị mỗi trang', true],
            ['enable_reviews', 'true', 'boolean', 'advanced', 'Kích hoạt đánh giá', 'Cho phép khách hàng đánh giá sản phẩm', true],
        ];

        const insertSQL = `
            INSERT INTO settings (setting_key, setting_value, setting_type, category, display_name, description, is_public)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        for (const setting of defaultSettings) {
            await connection.execute(insertSQL, setting);
        }

        console.log(`✅ Inserted ${defaultSettings.length} default settings`);

        // Verify
        const [count] = await connection.execute('SELECT COUNT(*) as total FROM settings');
        console.log(`\n📊 Total settings in database: ${count[0].total}`);

        console.log('\n✅ Settings table initialized successfully!');

    } catch (error) {
        console.error('❌ Error initializing settings table:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n👋 Database connection closed');
        }
    }
}

// Run the initialization
initializeSettingsTable();
