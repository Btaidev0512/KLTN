const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
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
      database: process.env.DB_NAME || 'ecommerce_db'
    });

    console.log('✅ Connected to database');

    // Read SQL file
    const sqlFile = path.join(__dirname, 'add-category-to-brands.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolon and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n📝 Running ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`${i + 1}. Executing:\n${statement.substring(0, 100)}...`);
      
      try {
        await connection.query(statement);
        console.log(`   ✅ Success\n`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`   ⚠️  Column already exists (skipping)\n`);
        } else if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`   ⚠️  Index/Constraint already exists (skipping)\n`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n🔍 Verifying column exists...');
    
    // Verify the column was added
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM brands LIKE 'category_id'`
    );
    
    if (columns.length > 0) {
      console.log('✅ column category_id exists in brands table');
      console.log('   Type:', columns[0].Type);
      console.log('   Null:', columns[0].Null);
      console.log('   Key:', columns[0].Key || 'None');
      console.log('   Default:', columns[0].Default);
    } else {
      console.log('❌ Column category_id was not created');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.sqlMessage) {
      console.error('   SQL Error:', error.sqlMessage);
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
