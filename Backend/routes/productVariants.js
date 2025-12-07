const express = require('express');
const router = express.Router();
const ProductVariant = require('../models/ProductVariant');
const { authenticateToken } = require('../middleware/auth');

// Helper để check admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có quyền thực hiện thao tác này'
    });
  }
};

// ==========================================
// 📋 GET /api/products/:productId/variants
// Lấy tất cả variants của 1 sản phẩm
// ==========================================
router.get('/:productId/variants', async (req, res) => {
  try {
    const { productId } = req.params;
    const variants = await ProductVariant.getByProductId(productId);
    
    res.json({
      success: true,
      data: variants
    });
  } catch (error) {
    console.error('❌ Error getting variants:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==========================================
// ➕ POST /api/products/:productId/variants
// Thêm variant mới (ADMIN ONLY)
// ==========================================
router.post('/:productId/variants', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, stock_quantity, sku } = req.body;

    if (!size) {
      return res.status(400).json({
        success: false,
        message: 'Size là bắt buộc'
      });
    }

    const variant = await ProductVariant.create({
      product_id: productId,
      size,
      stock_quantity: stock_quantity || 0,
      sku
    });

    // Cập nhật tổng stock trong products
    const totalStock = await ProductVariant.getTotalStock(productId);
    const db = require('../config/database');
    await db.execute(
      'UPDATE products SET stock_quantity = ? WHERE product_id = ?',
      [totalStock, productId]
    );

    res.json({
      success: true,
      message: 'Thêm variant thành công',
      data: variant
    });
  } catch (error) {
    console.error('❌ Error creating variant:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==========================================
// ✏️ PUT /api/products/variants/:variantId
// Cập nhật variant (ADMIN ONLY)
// ==========================================
router.put('/variants/:variantId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { variantId } = req.params;
    const { size, stock_quantity, sku, is_active } = req.body;

    const variant = await ProductVariant.update(variantId, {
      size,
      stock_quantity,
      sku,
      is_active
    });

    // Cập nhật tổng stock
    if (variant && stock_quantity !== undefined) {
      const totalStock = await ProductVariant.getTotalStock(variant.product_id);
      const db = require('../config/database');
      await db.execute(
        'UPDATE products SET stock_quantity = ? WHERE product_id = ?',
        [totalStock, variant.product_id]
      );
    }

    res.json({
      success: true,
      message: 'Cập nhật variant thành công',
      data: variant
    });
  } catch (error) {
    console.error('❌ Error updating variant:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==========================================
// 🗑️ DELETE /api/products/variants/:variantId
// Xóa variant (ADMIN ONLY)
// ==========================================
router.delete('/variants/:variantId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { variantId } = req.params;

    // Lấy product_id trước khi xóa
    const db = require('../config/database');
    const [rows] = await db.execute(
      'SELECT product_id FROM product_variants WHERE variant_id = ?',
      [variantId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Variant không tồn tại'
      });
    }

    const productId = rows[0].product_id;

    await ProductVariant.delete(variantId);

    // Cập nhật tổng stock
    const totalStock = await ProductVariant.getTotalStock(productId);
    await db.execute(
      'UPDATE products SET stock_quantity = ? WHERE product_id = ?',
      [totalStock, productId]
    );

    res.json({
      success: true,
      message: 'Xóa variant thành công'
    });
  } catch (error) {
    console.error('❌ Error deleting variant:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==========================================
// 🔄 POST /api/products/:productId/variants/bulk
// Cập nhật tất cả variants cùng lúc (ADMIN ONLY)
// ==========================================
router.post('/:productId/variants/bulk', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const { variants } = req.body; // Array: [{ size: '41', stock_quantity: 10 }, ...]

    if (!Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        message: 'Variants phải là array'
      });
    }

    await ProductVariant.bulkUpsert(productId, variants);

    // Cập nhật tổng stock
    const totalStock = await ProductVariant.getTotalStock(productId);
    const db = require('../config/database');
    await db.execute(
      'UPDATE products SET stock_quantity = ? WHERE product_id = ?',
      [totalStock, productId]
    );

    const updatedVariants = await ProductVariant.getByProductId(productId);

    res.json({
      success: true,
      message: 'Cập nhật tất cả variants thành công',
      data: {
        variants: updatedVariants,
        total_stock: totalStock
      }
    });
  } catch (error) {
    console.error('❌ Error bulk updating variants:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==========================================
// 🔍 GET /api/products/:productId/variants/check/:size
// Kiểm tra size có sẵn hàng không (PUBLIC)
// ==========================================
router.get('/:productId/variants/check/:size', async (req, res) => {
  try {
    const { productId, size } = req.params;
    const availability = await ProductVariant.checkAvailability(productId, size);
    
    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('❌ Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
