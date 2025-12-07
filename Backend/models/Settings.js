const db = require('../config/database');

class Settings {
    // Get all settings
    static async getAll() {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    setting_id,
                    setting_key,
                    setting_value,
                    setting_type,
                    category,
                    display_name,
                    description,
                    is_public,
                    updated_at
                FROM settings
                ORDER BY category, setting_id
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get settings by category
    static async getByCategory(category) {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    setting_id,
                    setting_key,
                    setting_value,
                    setting_type,
                    category,
                    display_name,
                    description,
                    is_public,
                    updated_at
                FROM settings
                WHERE category = ?
                ORDER BY setting_id
            `, [category]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get single setting by key
    static async getByKey(key) {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    setting_id,
                    setting_key,
                    setting_value,
                    setting_type,
                    category,
                    display_name,
                    description,
                    is_public,
                    updated_at
                FROM settings
                WHERE setting_key = ?
            `, [key]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Get public settings (for frontend without auth)
    static async getPublicSettings() {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    setting_key,
                    setting_value,
                    setting_type
                FROM settings
                WHERE is_public = TRUE
                ORDER BY category, setting_id
            `);
            
            // Convert to key-value object
            const settings = {};
            rows.forEach(row => {
                settings[row.setting_key] = this.parseValue(row.setting_value, row.setting_type);
            });
            
            return settings;
        } catch (error) {
            throw error;
        }
    }

    // Update single setting
    static async update(key, value) {
        try {
            const [result] = await db.execute(`
                UPDATE settings
                SET setting_value = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE setting_key = ?
            `, [value, key]);
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Update multiple settings (bulk update)
    static async updateMultiple(settingsArray) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            for (const setting of settingsArray) {
                await connection.execute(`
                    UPDATE settings
                    SET setting_value = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE setting_key = ?
                `, [setting.value, setting.key]);
            }
            
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Create new setting
    static async create(settingData) {
        try {
            const [result] = await db.execute(`
                INSERT INTO settings (
                    setting_key,
                    setting_value,
                    setting_type,
                    category,
                    display_name,
                    description,
                    is_public
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                settingData.key,
                settingData.value,
                settingData.type || 'text',
                settingData.category,
                settingData.displayName,
                settingData.description,
                settingData.isPublic || false
            ]);
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Delete setting
    static async delete(key) {
        try {
            const [result] = await db.execute(`
                DELETE FROM settings
                WHERE setting_key = ?
            `, [key]);
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Get settings as key-value object
    static async getAsObject(category = null) {
        try {
            let query = `
                SELECT 
                    setting_key,
                    setting_value,
                    setting_type
                FROM settings
            `;
            
            const params = [];
            if (category) {
                query += ' WHERE category = ?';
                params.push(category);
            }
            
            const [rows] = await db.execute(query, params);
            
            // Convert to key-value object with proper type conversion
            const settings = {};
            rows.forEach(row => {
                settings[row.setting_key] = this.parseValue(row.setting_value, row.setting_type);
            });
            
            return settings;
        } catch (error) {
            throw error;
        }
    }

    // Helper: Parse value based on type
    static parseValue(value, type) {
        if (value === null || value === undefined) return null;
        
        switch (type) {
            case 'number':
                return Number(value);
            case 'boolean':
                return value === 'true' || value === '1' || value === 1;
            case 'json':
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            default:
                return value;
        }
    }

    // Get categories list
    static async getCategories() {
        try {
            const [rows] = await db.execute(`
                SELECT DISTINCT category
                FROM settings
                ORDER BY category
            `);
            return rows.map(row => row.category);
        } catch (error) {
            throw error;
        }
    }

    // Check if setting exists
    static async exists(key) {
        try {
            const [rows] = await db.execute(`
                SELECT COUNT(*) as count
                FROM settings
                WHERE setting_key = ?
            `, [key]);
            
            return rows[0].count > 0;
        } catch (error) {
            throw error;
        }
    }

    // Reset to default values (use with caution)
    static async resetToDefaults() {
        try {
            // This would require storing default values somewhere
            // For now, just return false as it needs careful implementation
            return false;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Settings;
