const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Create new user
    static async create(userData) {
        try {
        const {
            username,
            full_name,
            email,
            password,
            phone = null,
            address = null,
            city = null,
            state = null,
            postal_code = null,
            country = 'Vietnam',
            date_of_birth = null,
            gender = null,
            role = 'customer'
        } = userData;            
        
            // Validate required fields
            if (!full_name || !email || !password) {
                throw new Error('Missing required fields');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Insert user with all new database fields
            const query = `
                INSERT INTO users (username, full_name, email, password, phone, address, city, state, postal_code, country, date_of_birth, gender, role)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.execute(query, [
                username || email, // Use email as username if not provided
                full_name,
                email,
                hashedPassword,
                phone,
                address,
                city,
                state,
                postal_code,
                country,
                date_of_birth,
                gender,
                role
            ]);

            // Return user without password
            const newUser = await this.findById(result.insertId);
            return newUser;

        } catch (error) {
            console.error('Error in User.create:', error);
            throw new Error(`Error creating user: ${error.message}`);
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            const query = 'SELECT user_id, username, full_name, email, phone, address, city, state, postal_code, country, date_of_birth, gender, role, avatar_url, is_active, created_at FROM users WHERE user_id = ?';
            const [rows] = await db.execute(query, [id]);
            
            // Add 'id' field for backward compatibility
            if (rows[0]) {
                rows[0].id = rows[0].user_id;
            }
            
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error finding user: ${error.message}`);
        }
    }

    // Find user by email
    static async findByEmail(email) {
        try {
            if (!email) {
                throw new Error('Email is required');
            }

            const query = 'SELECT * FROM users WHERE email = ? AND is_active = true';
            const [rows] = await db.execute(query, [email]);
            
            // Add 'id' field for backward compatibility
            if (rows[0]) {
                rows[0].id = rows[0].user_id;
            }
            
            return rows[0] || null;
        } catch (error) {
            console.error('Error in User.findByEmail:', error);
            throw new Error(`Error finding user: ${error.message}`);
        }
    }

    static async emailExists(email) {
        try {
            if (!email) {
                return false;
            }

            const query = 'SELECT user_id FROM users WHERE email = ?';
            const [rows] = await db.execute(query, [email]);
            return rows.length > 0;
        } catch (error) {
            console.error('Error in User.emailExists:', error);
            throw new Error(`Error checking email: ${error.message}`);
        }
    }

    // Update user
    static async update(id, userData) {
        try {
            const { full_name, phone, address, city, state, postal_code, country, date_of_birth, gender } = userData;
            
            const query = `
                UPDATE users 
                SET full_name = ?, phone = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?, date_of_birth = ?, gender = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;

            const [result] = await db.execute(query, [
                full_name || null,
                phone || null,
                address || null,
                city || null,
                state || null,
                postal_code || null,
                country || null,
                date_of_birth || null,
                gender || null,
                id
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in User.update:', error);
            throw new Error(`Error updating user: ${error.message}`);
        }
    }

    // ⭐ THÊM CÁC METHODS CHO FORGOT PASSWORD - SỬ DỤNG USERS TABLE
    static async saveResetToken(userId, token, expiry) {
        try {
            const query = `
                UPDATE users 
                SET reset_token = ?, reset_token_expires = ?
                WHERE user_id = ?
            `;
            await db.execute(query, [token, expiry, userId]);
        } catch (error) {
            throw new Error(`Error saving reset token: ${error.message}`);
        }
    }

    static async findByResetToken(token) {
        try {
            const query = `
                SELECT user_id, email, full_name, reset_token_expires
                FROM users 
                WHERE reset_token = ? AND is_active = true
            `;
            const [rows] = await db.execute(query, [token]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error finding user by reset token: ${error.message}`);
        }
    }

    static async clearResetToken(userId) {
        try {
            const query = `
                UPDATE users 
                SET reset_token = NULL, reset_token_expires = NULL
                WHERE user_id = ?
            `;
            await db.execute(query, [userId]);
        } catch (error) {
            throw new Error(`Error clearing reset token: ${error.message}`);
        }
    }

    // Find user by ID with password (for password verification)
    static async findByIdWithPassword(id) {
        try {
            const query = 'SELECT * FROM users WHERE user_id = ? AND is_active = true';
            const [rows] = await db.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error in User.findByIdWithPassword:', error);
            throw new Error(`Error finding user: ${error.message}`);
        }
    }

    // Update password
    static async updatePassword(id, hashedPassword) {
        try {
            const query = `
                UPDATE users 
                SET password = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;

            const [result] = await db.execute(query, [hashedPassword, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in User.updatePassword:', error);
            throw new Error(`Error updating password: ${error.message}`);
        }
    }

    // Update profile
    static async updateProfile(userId, profileData) {
        try {
            const { full_name, phone, address, city, state, postal_code, country, date_of_birth, gender } = profileData;
            
            const query = `
                UPDATE users 
                SET full_name = ?, phone = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?, date_of_birth = ?, gender = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;
            
            await db.execute(query, [
                full_name, 
                phone || null, 
                address || null, 
                city || null,
                state || null,
                postal_code || null,
                country || null,
                date_of_birth || null,
                gender || null,
                userId
            ]);
            
            // Return updated user
            return await this.findById(userId);
        } catch (error) {
            throw new Error(`Error updating profile: ${error.message}`);
        }
    }

    // Save reset token for password reset
    static async saveResetToken(userId, resetToken, expiresAt) {
        try {
            const query = `
                UPDATE users 
                SET reset_token = ?, reset_token_expires = ?
                WHERE user_id = ?
            `;
            
            const [result] = await db.execute(query, [resetToken, expiresAt, userId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in User.saveResetToken:', error);
            throw new Error(`Error saving reset token: ${error.message}`);
        }
    }

    // Find user by reset token
    static async findByResetToken(resetToken) {
        try {
            const query = `
                SELECT user_id, email, reset_token, reset_token_expires 
                FROM users 
                WHERE reset_token = ? AND reset_token_expires > NOW() AND is_active = true
            `;
            
            const [rows] = await db.execute(query, [resetToken]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error in User.findByResetToken:', error);
            throw new Error(`Error finding user by reset token: ${error.message}`);
        }
    }

    // Clear reset token after password reset
    static async clearResetToken(userId) {
        try {
            const query = `
                UPDATE users 
                SET reset_token = NULL, reset_token_expires = NULL
                WHERE user_id = ?
            `;
            
            const [result] = await db.execute(query, [userId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in User.clearResetToken:', error);
            throw new Error(`Error clearing reset token: ${error.message}`);
        }
    }

    // Get all users for admin with filters and pagination
    static async getAllForAdmin(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search = '',
                status,
                role,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = options;

            const offset = (page - 1) * limit;
            let query = `
                SELECT 
                    user_id,
                    username,
                    full_name,
                    email,
                    phone,
                    address,
                    city,
                    state,
                    postal_code,
                    country,
                    role,
                    is_active as status,
                    created_at,
                    updated_at
                FROM users
                WHERE 1=1
            `;
            const params = [];

            // Search filter
            if (search) {
                query += ` AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            // Status filter
            if (status !== undefined && status !== null) {
                const isActive = status === 'active' ? 1 : 0;
                query += ` AND is_active = ?`;
                params.push(isActive);
            }

            // Role filter
            if (role) {
                query += ` AND role = ?`;
                params.push(role);
            }

            // Get total count for pagination
            const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
            const [countResult] = await db.execute(countQuery, params);
            const total = countResult[0].total;

            // Add sorting and pagination
            const validSortColumns = ['user_id', 'full_name', 'email', 'created_at', 'role'];
            const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
            const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';
            
            query += ` ORDER BY ${sortColumn} ${sortDir} LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [users] = await db.execute(query, params);

            // Convert is_active to status string
            const formattedUsers = users.map(user => ({
                ...user,
                status: user.status === 1 ? 'active' : 'inactive'
            }));

            return {
                users: formattedUsers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error in User.getAllForAdmin:', error);
            throw new Error(`Error getting users: ${error.message}`);
        }
    }

    // Update user status (Admin only)
    static async updateStatus(userId, status) {
        try {
            const isActive = status === 'active' ? 1 : 0;
            const query = `
                UPDATE users 
                SET is_active = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `;
            
            const [result] = await db.execute(query, [isActive, userId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in User.updateStatus:', error);
            throw new Error(`Error updating user status: ${error.message}`);
        }
    }

}

module.exports = User;