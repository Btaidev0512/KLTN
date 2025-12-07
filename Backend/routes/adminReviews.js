const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/reviews - Get all reviews with pagination and filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      rating,
      product_id,
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'pending') {
        whereConditions.push('r.is_approved = 0');
      } else if (status === 'approved') {
        whereConditions.push('r.is_approved = 1');
      }
    }

    // Filter by rating
    if (rating && rating !== 'all') {
      whereConditions.push('r.rating = ?');
      params.push(parseInt(rating));
    }

    // Filter by product
    if (product_id) {
      whereConditions.push('r.product_id = ?');
      params.push(product_id);
    }

    // Search by review text or customer name
    if (search) {
      whereConditions.push('(r.comment LIKE ? OR u.full_name LIKE ? OR p.product_name LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      ${whereClause}
    `;
    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;

    // Get reviews
    const query = `
      SELECT 
        r.review_id,
        r.user_id,
        r.product_id,
        r.rating,
        r.title,
        r.comment as review_text,
        r.is_approved,
        r.is_verified,
        r.created_at as review_date,
        r.updated_at,
        CASE 
          WHEN r.is_approved = 0 THEN 'pending'
          WHEN r.is_approved = 1 THEN 'approved'
        END as status,
        u.full_name as customer_name,
        u.email as customer_email,
        p.product_name,
        p.image_url as product_image
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [reviews] = await db.execute(query, [...params, parseInt(limit), offset]);

    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Lỗi khi tải danh sách đánh giá' });
  }
});

// GET /api/admin/reviews/stats - Get review statistics
router.get('/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved,
        0 as rejected,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews
    `;

    const [result] = await db.execute(query);
    const stats = result[0];

    res.json({
      total: stats.total,
      pending: stats.pending,
      approved: stats.approved,
      rejected: stats.rejected,
      avgRating: parseFloat(stats.avg_rating || 0).toFixed(1),
      ratingDistribution: {
        5: stats.five_star,
        4: stats.four_star,
        3: stats.three_star,
        2: stats.two_star,
        1: stats.one_star,
      },
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ message: 'Lỗi khi tải thống kê đánh giá' });
  }
});

// GET /api/admin/reviews/:id - Get single review
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        r.review_id,
        r.user_id,
        r.product_id,
        r.rating,
        r.title,
        r.comment as review_text,
        r.is_approved,
        r.is_verified,
        r.created_at as review_date,
        CASE 
          WHEN r.is_approved = 0 THEN 'pending'
          WHEN r.is_approved = 1 THEN 'approved'
        END as status,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone_number as customer_phone,
        p.product_name,
        p.image_url as product_image,
        p.base_price as product_price
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      WHERE r.review_id = ?
    `;

    const [reviews] = await db.execute(query, [id]);

    if (reviews.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    res.json(reviews[0]);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ message: 'Lỗi khi tải chi tiết đánh giá' });
  }
});

// PUT /api/admin/reviews/:id/approve - Approve review
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists
    const [existing] = await db.execute(
      'SELECT * FROM reviews WHERE review_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    // Update status to approved
    await db.execute(
      'UPDATE reviews SET is_approved = 1 WHERE review_id = ?',
      [id]
    );

    res.json({ message: 'Đã duyệt đánh giá thành công' });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ message: 'Lỗi khi duyệt đánh giá' });
  }
});

// PUT /api/admin/reviews/:id/reject - Reject review
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists
    const [existing] = await db.execute(
      'SELECT * FROM reviews WHERE review_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    // Delete review (reject = delete)
    await db.execute(
      'DELETE FROM reviews WHERE review_id = ?',
      [id]
    );

    res.json({ message: 'Đã từ chối đánh giá' });
  } catch (error) {
    console.error('Error rejecting review:', error);
    res.status(500).json({ message: 'Lỗi khi từ chối đánh giá' });
  }
});

// POST /api/admin/reviews/:id/reply - Reply to review
router.post('/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_reply } = req.body;

    if (!admin_reply || admin_reply.trim() === '') {
      return res.status(400).json({ message: 'Nội dung trả lời không được để trống' });
    }

    // Check if review exists
    const [existing] = await db.execute(
      'SELECT * FROM reviews WHERE review_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    // Update admin reply
    await db.execute(
      'UPDATE reviews SET admin_reply = ?, reply_date = NOW() WHERE review_id = ?',
      [admin_reply, id]
    );

    res.json({ message: 'Đã trả lời đánh giá thành công' });
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ message: 'Lỗi khi trả lời đánh giá' });
  }
});

// DELETE /api/admin/reviews/:id - Delete review
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists
    const [existing] = await db.execute(
      'SELECT * FROM reviews WHERE review_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    // Delete review
    await db.execute('DELETE FROM reviews WHERE review_id = ?', [id]);

    res.json({ message: 'Đã xóa đánh giá thành công' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Lỗi khi xóa đánh giá' });
  }
});

module.exports = router;
