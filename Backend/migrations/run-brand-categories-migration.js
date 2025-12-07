const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce_db'
  });

  try {
    console.log('🔄 Creating brand_categories table...');
    
    // Create table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS brand_categories (
        brand_id INT NOT NULL,
        category_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (brand_id, category_id),
        FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
        INDEX idx_brand (brand_id),
        INDEX idx_category (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Table created successfully');
    
    // Migrate existing data
    console.log('🔄 Migrating existing data...');
    const [result] = await connection.execute(`
      INSERT INTO brand_categories (brand_id, category_id)
      SELECT b.brand_id, b.category_id
      FROM brands b
      WHERE b.category_id IS NOT NULL
      ON DUPLICATE KEY UPDATE brand_id = brand_id
    `);
    
    console.log(`✅ Migrated ${result.affectedRows} records`);
    
    // Show current data
    const [rows] = await connection.execute(`
      SELECT bc.*, b.brand_name, c.category_name
      FROM brand_categories bc
      JOIN brands b ON bc.brand_id = b.brand_id
      JOIN categories c ON bc.category_id = c.category_id
      ORDER BY b.brand_name, c.category_name
    `);
    
    console.log('\n📊 Current brand-category mappings:');
    console.table(rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await connection.end();
  }
}

runMigration();
