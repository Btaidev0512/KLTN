const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🔍 Reading migration file...');
        const sqlPath = path.join(__dirname, 'create-banners-table.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split SQL into separate statements, ignore comments
        const statements = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`📊 Executing ${statements.length} SQL statements...`);
        
        for (let i = 0; i < statements.length; i++) {
            console.log(`  Executing statement ${i + 1}/${statements.length}...`);
            await pool.query(statements[i]);
        }

        console.log('✅ Banners table created successfully!');
        console.log('✅ Default banners inserted!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runMigration();
