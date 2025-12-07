const mysql = require('mysql2/promise');
require('dotenv').config();

const initDatabase = async () => {
  let connection;
  
  try {
    // Kết nối không chọn database để tạo database mới
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔗 Connected to MySQL server');

    // Tạo database với tên mới
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`📊 Database '${process.env.DB_NAME}' created or exists`);

    // Chọn database - sử dụng query thay vì execute
    await connection.query(`USE \`${process.env.DB_NAME}\``);

    // Tạo bảng users
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NULL,
        address TEXT NULL,
        city VARCHAR(100) NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createUsersTable);
    console.log('👤 Users table created successfully');

    // Tạo bảng password_reset_tokens
    const createPasswordResetTable = `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createPasswordResetTable);
    console.log('🔑 Password reset tokens table created successfully');

    // Kiểm tra xem admin đã tồn tại chưa
    const [existingAdmin] = await connection.execute('SELECT id FROM users WHERE email = ?', ['admin@ecommerce.com']);
    
    if (existingAdmin.length === 0) {
      // Thêm admin user
      await connection.execute(
        'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
        ['admin@ecommerce.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMhBG6.c1qeWYBG', 'Administrator', 'admin']
      );
      console.log('👨‍💼 Admin user created (email: admin@ecommerce.com, password: admin123)');
    } else {
      console.log('👨‍💼 Admin user already exists');
    }

    // Kiểm tra số lượng users
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Total users: ${userCount[0].count}`);

    console.log('✅ Database initialization completed successfully!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('🎉 E-commerce Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };