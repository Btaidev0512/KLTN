const db = require('../config/database');

class Payment {
    // Create a new payment record
    static async create(paymentData) {
        try {
            const {
                order_id,
                payment_method,
                amount,
                currency,
                gateway_transaction_id,
                gateway_response,
                status,
                paid_at
            } = paymentData;

            const query = `
                INSERT INTO payments (
                    order_id, payment_method, amount, currency, 
                    gateway_transaction_id, gateway_response, status, paid_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.execute(query, [
                order_id,
                payment_method,
                amount,
                currency || 'VND',
                gateway_transaction_id,
                JSON.stringify(gateway_response),
                status || 'pending',
                paid_at
            ]);

            return result.insertId;
        } catch (error) {
            throw new Error('Error creating payment: ' + error.message);
        }
    }

    // Get payment by ID
    static async getById(paymentId) {
        try {
            const query = 'SELECT * FROM payments WHERE payment_id = ?';
            const [payments] = await db.execute(query, [paymentId]);
            return payments.length > 0 ? payments[0] : null;
        } catch (error) {
            throw new Error('Error getting payment: ' + error.message);
        }
    }

    // Get payment by order ID
    static async getByOrderId(orderId) {
        try {
            const query = 'SELECT * FROM payments WHERE order_id = ?';
            const [payments] = await db.execute(query, [orderId]);
            return payments;
        } catch (error) {
            throw new Error('Error getting payments by order: ' + error.message);
        }
    }

    // Get payment by gateway transaction ID
    static async getByGatewayTransactionId(transactionId) {
        try {
            const query = 'SELECT * FROM payments WHERE gateway_transaction_id = ?';
            const [payments] = await db.execute(query, [transactionId]);
            return payments.length > 0 ? payments[0] : null;
        } catch (error) {
            throw new Error('Error getting payment by transaction ID: ' + error.message);
        }
    }

    // Update payment status
    static async updateStatus(paymentId, status, gatewayResponse = null, paidAt = null) {
        try {
            let query = 'UPDATE payments SET status = ?';
            const params = [status];

            if (gatewayResponse) {
                query += ', gateway_response = ?';
                params.push(JSON.stringify(gatewayResponse));
            }

            if (paidAt) {
                query += ', paid_at = ?';
                params.push(paidAt);
            }

            query += ', updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?';
            params.push(paymentId);

            const [result] = await db.execute(query, params);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error('Error updating payment status: ' + error.message);
        }
    }

    // Get payment statistics
    static async getStats() {
        try {
            const queries = [
                // Total payments by status
                `SELECT status, COUNT(*) as count, SUM(amount) as total_amount 
                 FROM payments GROUP BY status`,
                
                // Payment methods usage
                `SELECT payment_method, COUNT(*) as count, SUM(amount) as total_amount 
                 FROM payments GROUP BY payment_method`,
                
                // Monthly payment summary
                `SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as total_payments,
                    SUM(amount) as total_amount,
                    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as successful_amount
                 FROM payments 
                 WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                 ORDER BY month DESC`
            ];

            const [statusStats] = await db.execute(queries[0]);
            const [methodStats] = await db.execute(queries[1]);
            const [monthlyStats] = await db.execute(queries[2]);

            return {
                by_status: statusStats,
                by_method: methodStats,
                monthly_summary: monthlyStats,
                generated_at: new Date().toISOString()
            };
        } catch (error) {
            throw new Error('Error getting payment statistics: ' + error.message);
        }
    }

    // Get all payments with filters
    static async getAll(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                payment_method,
                start_date,
                end_date,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = options;

            let query = `
                SELECT p.*, o.total_amount as order_total
                FROM payments p
                LEFT JOIN orders o ON p.order_id = o.order_id
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                query += ' AND p.status = ?';
                params.push(status);
            }

            if (payment_method) {
                query += ' AND p.payment_method = ?';
                params.push(payment_method);
            }

            if (start_date) {
                query += ' AND p.created_at >= ?';
                params.push(start_date);
            }

            if (end_date) {
                query += ' AND p.created_at <= ?';
                params.push(end_date);
            }

            const validSortFields = ['created_at', 'amount', 'status', 'payment_method'];
            const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
            const sortDirection = ['ASC', 'DESC'].includes(sort_order) ? sort_order : 'DESC';

            query += ` ORDER BY p.${sortField} ${sortDirection}`;
            query += ' LIMIT ? OFFSET ?';
            params.push(limit, (page - 1) * limit);

            const [payments] = await db.execute(query, params);

            // Get total count
            let countQuery = `
                SELECT COUNT(*) as total
                FROM payments p
                WHERE 1=1
            `;
            const countParams = params.slice(0, -2); // Remove limit and offset

            if (status) countQuery += ' AND p.status = ?';
            if (payment_method) countQuery += ' AND p.payment_method = ?';
            if (start_date) countQuery += ' AND p.created_at >= ?';
            if (end_date) countQuery += ' AND p.created_at <= ?';

            const [countResult] = await db.execute(countQuery, countParams);
            const totalCount = countResult[0].total;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                payments,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error('Error getting all payments: ' + error.message);
        }
    }
}

module.exports = Payment;