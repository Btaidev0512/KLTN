const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { sendResetPasswordEmail, sendPasswordChangedEmail } = require('../config/email');

const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, full_name, email, password, phone, address, city, state, postal_code, country, date_of_birth, gender } = req.body;

        const emailExists = await User.emailExists(email);
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const userData = {
            username: username || email,
            full_name: full_name || null,
            email: email || null,
            password: password || null,
            phone: phone || null,
            address: address || null,
            city: city || null,
            state: state || null,
            postal_code: postal_code || null,
            country: country || 'Vietnam',
            date_of_birth: date_of_birth || null,
            gender: gender || null,
            role: 'customer'
        };

        const newUser = await User.create(userData);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    user_id: newUser.user_id,
                    username: newUser.username,
                    full_name: newUser.full_name,
                    email: newUser.email,
                    phone: newUser.phone,
                    role: newUser.role
                }
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { id: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            data: {
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('🔍 Forgot password request for:', email);

        const user = await User.findByEmail(email);
        if (!user) {
            console.log('❌ User not found for email:', email);
            return res.json({
                success: true,
                message: 'If the email exists in our system, a password reset link will be sent.'
            });
        }

        console.log('👤 User found:', { user_id: user.user_id, email: user.email });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        console.log('🔑 Generated reset token:', resetToken);
        console.log('📏 Token length:', resetToken.length);
        console.log('🕒 Token expires at:', expiresAt.toISOString());

        console.log('💾 Saving reset token to database...');
        await User.saveResetToken(user.user_id, resetToken, expiresAt);
        console.log('✅ Reset token saved successfully');

        // 🆕 GỬI EMAIL THỰC SỰ
        try {
            console.log('📧 Sending reset email to:', email);
            await sendResetPasswordEmail(email, resetToken);
            console.log('✅ Reset email sent successfully');
            
            res.json({
                success: true,
                message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư (cả folder Spam).'
            });
        } catch (emailError) {
            console.error('❌ Failed to send email:', emailError.message);
            
            // Vẫn trả về success để không tiết lộ thông tin
            res.json({
                success: true,
                message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.',
                error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
        }

    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, resetToken, newPassword } = req.body;
        const actualToken = token || resetToken;
        console.log('🔄 Reset password attempt with token:', actualToken ? actualToken.substring(0, 20) + '...' : 'null');

        if (!actualToken || !newPassword) {
            console.log('❌ Missing token or password');
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        console.log('🔍 Looking for reset token in database...');
        const resetRecord = await User.findByResetToken(actualToken);
        console.log('📋 Reset record found:', resetRecord ? 'YES' : 'NO');
        
        if (resetRecord) {
            console.log('👤 Reset record details:', {
                user_id: resetRecord.user_id,
                email: resetRecord.email,
                expires: resetRecord.reset_token_expires,
                now: new Date().toISOString()
            });
        }
        
        if (!resetRecord) {
            console.log('❌ Invalid reset token - not found in database');
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        // Check if token has expired
        const now = new Date();
        const expiryDate = new Date(resetRecord.reset_token_expires);
        console.log('⏰ Time check:', { now, expiryDate, expired: now > expiryDate });
        
        if (now > expiryDate) {
            console.log('❌ Reset token has expired');
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired'
            });
        }

        console.log('✅ Token valid, updating password...');
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await User.updatePassword(resetRecord.user_id, hashedNewPassword);
        await User.clearResetToken(resetRecord.user_id);
        
        console.log('✅ Password reset successfully for user:', resetRecord.email);
        
        // 🆕 Gửi email thông báo thay đổi mật khẩu thành công
        try {
            await sendPasswordChangedEmail(resetRecord.email);
            console.log('✅ Password changed notification sent');
        } catch (emailError) {
            console.error('⚠️ Failed to send notification email:', emailError.message);
            // Không fail request nếu email thông báo lỗi
        }
        
        res.json({
            success: true,
            message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay bây giờ.'
        });

    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        console.log('🔍 GetProfile controller hit');
        console.log('req.user:', req.user);
        console.log('req.user keys:', req.user ? Object.keys(req.user) : 'null');
        
        // req.user được set bởi middleware auth từ User.findById(decoded.id)
        const user = req.user;
        
        if (!user) {
            console.log('❌ No user in req.user');
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('✅ User found in req.user:', user.email);
        res.json({
            success: true,
            data: {
                user: {
                    user_id: user.user_id,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    city: user.city,
                    gender: user.gender,
                    birth_date: user.date_of_birth,  // Map date_of_birth -> birth_date
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone, address, city, gender, birth_date } = req.body;

        console.log('📝 Update profile request:', {
            user_id: req.user.user_id,
            body: req.body
        });

        const userData = {
            full_name: full_name || null,
            phone: phone || null,
            address: address || null,
            city: city || null,
            gender: gender || null,
            date_of_birth: birth_date || null  // Map birth_date -> date_of_birth
        };

        await User.update(req.user.user_id, userData);
        const updatedUser = await User.findById(req.user.user_id);

        console.log('✅ Profile updated successfully:', updatedUser);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { current_password, new_password, currentPassword, newPassword } = req.body;
        
        // Support both naming conventions
        const currentPass = current_password || currentPassword;
        const newPass = new_password || newPassword;

        if (!currentPass || !newPass) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        const user = await User.findByIdWithPassword(req.user.user_id || req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isValidPassword = await bcrypt.compare(currentPass, user.password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        const hashedNewPassword = await bcrypt.hash(newPass, 12);
        await User.updatePassword(req.user.user_id || req.user.id, hashedNewPassword);

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi đổi mật khẩu'
        });
    }
};

const refreshToken = async (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Refresh token functionality not implemented yet'
    });
};

const logout = async (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

// 👥 Get all users for admin with filtering
const getAllUsersAdmin = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            status,
            role,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 100),
            search: search.trim(),
            status,
            role,
            sort_by,
            sort_order: sort_order.toUpperCase()
        };

        const result = await User.getAllForAdmin(options);

        res.json({
            success: true,
            message: 'Users retrieved successfully',
            data: result.users,
            pagination: result.pagination,
            count: result.users.length
        });
    } catch (error) {
        console.error('Error getting users for admin:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        });
    }
};

// 🔄 Update user status (Admin only)
const updateUserStatusAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['active', 'inactive'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid statuses: active, inactive'
            });
        }

        // Prevent admin from deactivating themselves
        if (parseInt(id) === req.user.user_id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change your own account status'
            });
        }

        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const success = await User.updateStatus(id, status);

        if (success) {
            console.log(`Admin ${req.user.user_id} updated user ${id} status to ${status}`);

            res.json({
                success: true,
                message: 'User status updated successfully',
                data: {
                    user_id: id,
                    new_status: status
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to update user status'
            });
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
};

// 📊 Get user statistics
const getUserStats = async (req, res) => {
    try {
        const stats = await User.getStats();

        res.json({
            success: true,
            message: 'User statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user statistics',
            error: error.message
        });
    }
};

// 🗑️ Delete user (Admin only)
const deleteUserAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (parseInt(id) === req.user.user_id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        const existingUser = await User.getById(id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has orders - if yes, deactivate instead of delete
        const hasOrders = await User.hasOrders(id);
        if (hasOrders) {
            const success = await User.updateStatus(id, 'inactive');
            return res.json({
                success: true,
                message: 'User deactivated (has order history)',
                data: {
                    user_id: id,
                    action: 'deactivated'
                }
            });
        }

        const success = await User.delete(id);

        if (success) {
            console.log(`Admin ${req.user.user_id} deleted user ${id}`);

            res.json({
                success: true,
                message: 'User deleted successfully',
                data: {
                    user_id: id,
                    action: 'deleted'
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to delete user'
            });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword,
    // Admin functions
    getAllUsersAdmin,
    updateUserStatusAdmin,
    getUserStats,
    deleteUserAdmin
};
