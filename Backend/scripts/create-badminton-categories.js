const mysql = require('mysql2/promise');
require('dotenv').config();

const createBadmintonCategories = async () => {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ecommerce_db'
    });

    console.log('✅ Connected to MySQL database');
    console.log('🏸 Creating badminton categories...\n');

    // Disable foreign key checks temporarily
    console.log('🔓 Step 0: Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Foreign key checks disabled\n');

    // 1. Backup existing categories
    console.log('📦 Step 1: Backing up existing categories...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories_backup 
      AS SELECT * FROM categories
    `);
    console.log('✅ Backup completed\n');

    // 2. Update products to remove category association (temporary)
    console.log('🔄 Step 2: Temporarily unlinking products...');
    await connection.query('UPDATE products SET category_id = NULL');
    console.log('✅ Products unlinked\n');

    // 3. Delete old categories
    console.log('🗑️  Step 3: Removing old categories...');
    await connection.query('DELETE FROM categories');
    await connection.query('ALTER TABLE categories AUTO_INCREMENT = 1');
    console.log('✅ Old categories removed\n');

    // 4. Insert new badminton categories
    console.log('✨ Step 4: Creating new badminton categories...');
    
    // Main categories
    const mainCategories = [
      ['Vợt Cầu Lông', 'vot-cau-long', 'Vợt cầu lông chuyên nghiệp từ các thương hiệu hàng đầu', 1],
      ['Giày Cầu Lông', 'giay-cau-long', 'Giày cầu lông chuyên dụng, chống trơn trượt', 2],
      ['Cầu Lông', 'cau-long', 'Cầu lông thi đấu và tập luyện chất lượng cao', 3],
      ['Phụ Kiện Cầu Lông', 'phu-kien-cau-long', 'Phụ kiện và dụng cụ hỗ trợ chơi cầu lông', 4],
      ['Quần Áo Cầu Lông', 'quan-ao-cau-long', 'Trang phục thể thao chuyên dụng cho cầu lông', 5],
      ['Túi Vợt', 'tui-vot', 'Balo và túi đựng vợt cầu lông', 6]
    ];

    for (const [name, slug, desc, order] of mainCategories) {
      await connection.query(
        `INSERT INTO categories (category_name, category_slug, description, parent_id, sort_order, is_active) 
         VALUES (?, ?, ?, NULL, ?, 1)`,
        [name, slug, desc, order]
      );
      console.log(`   ✓ Created: ${name}`);
    }

    // Sub-categories for Vợt Cầu Lông (parent_id = 1)
    const racketSubCategories = [
      ['Vợt Tấn Công', 'vot-tan-cong', 'Vợt cầu lông thiên về tấn công, đập cầu mạnh', 1, 1],
      ['Vợt Phòng Thủ', 'vot-phong-thu', 'Vợt cầu lông thiên về phòng thủ, kiểm soát tốt', 1, 2],
      ['Vợt Cân Bằng', 'vot-can-bang', 'Vợt cầu lông cân bằng giữa tấn công và phòng thủ', 1, 3]
    ];

    // Sub-categories for Giày Cầu Lông (parent_id = 2)
    const shoeSubCategories = [
      ['Giày Nam', 'giay-nam', 'Giày cầu lông nam các size', 2, 1],
      ['Giày Nữ', 'giay-nu', 'Giày cầu lông nữ các size', 2, 2],
      ['Giày Trẻ Em', 'giay-tre-em', 'Giày cầu lông cho trẻ em', 2, 3]
    ];

    // Sub-categories for Cầu Lông (parent_id = 3)
    const shuttlecockSubCategories = [
      ['Cầu Lông Nhựa', 'cau-long-nhua', 'Cầu lông nhựa bền, dùng tập luyện', 3, 1],
      ['Cầu Lông Lông Vịt', 'cau-long-long-vit', 'Cầu lông lông vịt thi đấu chuyên nghiệp', 3, 2]
    ];

    // Sub-categories for Phụ Kiện (parent_id = 4)
    const accessorySubCategories = [
      ['Dây Cước Vợt', 'day-cuoc-vot', 'Dây cước vợt các loại', 4, 1],
      ['Quấn Cán Vợt', 'quan-can-vot', 'Quấn cán vợt (grip) chống trơn', 4, 2],
      ['Băng Bảo Vệ', 'bang-bao-ve', 'Băng cổ tay, băng đầu gối', 4, 3],
      ['Lưới Cầu Lông', 'luoi-cau-long', 'Lưới thi đấu cầu lông', 4, 4]
    ];

    const allSubCategories = [
      ...racketSubCategories,
      ...shoeSubCategories,
      ...shuttlecockSubCategories,
      ...accessorySubCategories
    ];

    for (const [name, slug, desc, parentId, order] of allSubCategories) {
      await connection.query(
        `INSERT INTO categories (category_name, category_slug, description, parent_id, sort_order, is_active) 
         VALUES (?, ?, ?, ?, ?, 1)`,
        [name, slug, desc, parentId, order]
      );
      console.log(`   ✓ Created sub-category: ${name} (under parent ${parentId})`);
    }

    console.log('\n✅ All categories created successfully!\n');

    // 5. Verify categories
    console.log('📊 Step 5: Verifying created categories...');
    const [categories] = await connection.query(`
      SELECT 
        c1.category_id,
        c1.category_name,
        c1.category_slug,
        c2.category_name as parent_category,
        c1.sort_order,
        c1.is_active
      FROM categories c1
      LEFT JOIN categories c2 ON c1.parent_id = c2.category_id
      ORDER BY c1.parent_id, c1.sort_order
    `);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              BADMINTON CATEGORIES CREATED                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.table(categories);

    console.log('\n📋 Summary:');
    console.log(`   • Total categories: ${categories.length}`);
    console.log(`   • Main categories: ${mainCategories.length}`);
    console.log(`   • Sub-categories: ${allSubCategories.length}`);

    console.log('\n⚠️  NEXT STEPS:');
    console.log('   1. Update your products to assign them to new categories');
    console.log('   2. Remove category mapping in frontend/src/components/Layout/Header.tsx');
    console.log('   3. Test admin dashboard: http://localhost:3000/admin/categories');
    console.log('   4. Test frontend menu: http://localhost:3000\n');

    console.log('🎯 Example SQL to update products:');
    console.log(`
UPDATE products 
SET category_id = 1 
WHERE product_name LIKE '%vợt%' OR product_name LIKE '%racket%';

UPDATE products 
SET category_id = 2 
WHERE product_name LIKE '%giày%' OR product_name LIKE '%shoe%';

UPDATE products 
SET category_id = 3 
WHERE product_name LIKE '%cầu%' OR product_name LIKE '%shuttlecock%';

UPDATE products 
SET category_id = 4 
WHERE product_name LIKE '%phụ kiện%' OR product_name LIKE '%grip%';
    `);

    console.log('\n✅ Script completed successfully! 🏸');

    // Re-enable foreign key checks
    console.log('\n🔒 Re-enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Foreign key checks enabled');

  } catch (error) {
    console.error('\n❌ Error creating badminton categories:', error.message);
    console.error('Stack:', error.stack);
    
    if (connection) {
      console.log('\n🔄 Rolling back changes...');
      try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DELETE FROM categories');
        await connection.query(`
          INSERT INTO categories 
          SELECT * FROM categories_backup
        `);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Rollback completed');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError.message);
      }
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Database connection closed');
    }
  }
};

// Run the script
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     🏸 BADMINTON CATEGORIES CREATION SCRIPT 🏸            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log('⚠️  WARNING: This will replace ALL existing categories!');
console.log('📦 A backup will be created as "categories_backup" table\n');

createBadmintonCategories();
