const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ecommerce_db',
      multipleStatements: true
    });

    console.log('✅ Connected to database');
    console.log('\n📝 Adding category_id column to brands table...\n');

    // Check if column already exists
    const [existingColumns] = await connection.query(
      `SHOW COLUMNS FROM brands LIKE 'category_id'`
    );

    if (existingColumns.length > 0) {
      console.log('⚠️  Column category_id already exists! Migration not needed.');
      console.log('   Type:', existingColumns[0].Type);
      console.log('   Null:', existingColumns[0].Null);
      await connection.end();
      return;
    }

    // Add column
    console.log('1. Adding category_id column...');
    await connection.query(`
      ALTER TABLE brands 
      ADD COLUMN category_id INT NULL AFTER brand_slug
    `);
    console.log('   ✅ Column added\n');

    // Add foreign key
    console.log('2. Adding foreign key constraint...');
    try {
      await connection.query(`
        ALTER TABLE brands
        ADD CONSTRAINT fk_brands_category 
          FOREIGN KEY (category_id) 
          REFERENCES categories(category_id) 
          ON DELETE SET NULL 
          ON UPDATE CASCADE
      `);
      console.log('   ✅ Foreign key added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('   ⚠️  Foreign key already exists (skipping)\n');
      } else {
        throw error;
      }
    }

    // Add index
    console.log('3. Adding index...');
    try {
      await connection.query(`
        CREATE INDEX idx_brands_category_id ON brands(category_id)
      `);
      console.log('   ✅ Index added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('   ⚠️  Index already exists (skipping)\n');
      } else {
        throw error;
      }
    }

    console.log('✅ Migration completed successfully!\n');
    
    // Verify
    console.log('🔍 Verifying column exists...');
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM brands LIKE 'category_id'`
    );
    
    if (columns.length > 0) {
      console.log('✅ Column category_id exists in brands table');
      console.log('   Type:', columns[0].Type);
      console.log('   Null:', columns[0].Null);
      console.log('   Key:', columns[0].Key || 'None');
      console.log('   Default:', columns[0].Default || 'NULL');
    }

    // Show foreign keys
    const [fks] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'brands'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME || 'ecommerce_db']);

    if (fks.length > 0) {
      console.log('\n📋 Foreign keys:');
      fks.forEach(fk => {
        console.log(`   ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}(${fk.REFERENCED_COLUMN_NAME})`);
      });
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.sqlMessage) {
      console.error('   SQL Error:', error.sqlMessage);
    }
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the migration
runMigration();
