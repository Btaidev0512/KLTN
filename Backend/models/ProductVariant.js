const db = require('../config/database');

/**
 * ProductVariant Model - Version 2.0
 * Quản lý ĐƠN GIẢN: Chỉ Size + Stock (KHÔNG có màu sắc)
 * 
 * Ví dụ: Giày có 3 size:
 * - Size 41: 10 đôi
 * - Size 39: 5 đôi
 * - Size 36: 5 đôi
 * → Tổng kho: 20 đôi (tự động tính)
 */
class ProductVariant {
  // ==========================================
  // 📋 Lấy tất cả variants của 1 sản phẩm
  // ==========================================
  static async getByProductId(productId) {
    try {
      const [rows] = await db.execute(
        `SELECT 
          variant_id,
          product_id,
          size,
          stock_quantity,
          sku,
          is_active,
          created_at,
          updated_at
        FROM product_variants 
        WHERE product_id = ?
        ORDER BY 
          CASE 
            WHEN size REGEXP '^[0-9]+$' THEN CAST(size AS UNSIGNED)
            ELSE 999 
          END,
          size`,
        [productId]
      );
      return rows;
    } catch (error) {
      console.error('❌ Error getting variants:', error);
      throw error;
    }
  }

  // ==========================================
  // ➕ Thêm variant mới
  // ==========================================
  static async create(variantData) {
    const { product_id, size, stock_quantity = 0, sku = null } = variantData;

    try {
      // Kiểm tra size đã tồn tại chưa
      const [existing] = await db.execute(
        'SELECT variant_id FROM product_variants WHERE product_id = ? AND size = ?',
        [product_id, size]
      );

      if (existing.length > 0) {
        throw new Error(`Size ${size} đã tồn tại cho sản phẩm này`);
      }

      const [result] = await db.execute(
        `INSERT INTO product_variants 
        (product_id, size, stock_quantity, sku, is_active) 
        VALUES (?, ?, ?, ?, 1)`,
        [product_id, size, stock_quantity, sku]
      );

      console.log(`✅ Created variant: Size ${size}, Stock ${stock_quantity}`);

      return {
        variant_id: result.insertId,
        product_id,
        size,
        stock_quantity,
        sku,
        is_active: 1
      };
    } catch (error) {
      console.error('❌ Error creating variant:', error);
      throw error;
    }
  }

  // ==========================================
  // ✏️ Cập nhật variant
  // ==========================================
  static async update(variantId, updateData) {
    const { size, stock_quantity, sku, is_active } = updateData;

    try {
      const updates = [];
      const values = [];

      if (size !== undefined) {
        updates.push('size = ?');
        values.push(size);
      }
      if (stock_quantity !== undefined) {
        updates.push('stock_quantity = ?');
        values.push(stock_quantity);
      }
      if (sku !== undefined) {
        updates.push('sku = ?');
        values.push(sku);
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(is_active);
      }

      if (updates.length === 0) {
        throw new Error('Không có dữ liệu để cập nhật');
      }

      values.push(variantId);

      await db.execute(
        `UPDATE product_variants SET ${updates.join(', ')} WHERE variant_id = ?`,
        values
      );

      console.log(`✅ Updated variant ${variantId}`);

      // Lấy variant sau khi update
      const [rows] = await db.execute(
        'SELECT * FROM product_variants WHERE variant_id = ?',
        [variantId]
      );

      return rows[0];
    } catch (error) {
      console.error('❌ Error updating variant:', error);
      throw error;
    }
  }

  // ==========================================
  // 🗑️ Xóa variant
  // ==========================================
  static async delete(variantId) {
    try {
      await db.execute('DELETE FROM product_variants WHERE variant_id = ?', [variantId]);
      console.log(`✅ Deleted variant ${variantId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting variant:', error);
      throw error;
    }
  }

  // ==========================================
  // 🔄 Bulk update: Cập nhật nhiều variants cùng lúc
  // ==========================================
  static async bulkUpsert(productId, variantsArray) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Xóa tất cả variants cũ (dùng SET SQL_SAFE_UPDATES = 0 nếu cần)
      await connection.execute(
        'DELETE FROM product_variants WHERE product_id = ?',
        [productId]
      );

      // Thêm variants mới (chỉ thêm variants có size không trống)
      for (const variant of variantsArray) {
        if (variant.size && variant.size.trim() !== '') {
          await connection.execute(
            `INSERT INTO product_variants 
            (product_id, size, stock_quantity, sku, is_active) 
            VALUES (?, ?, ?, ?, 1)`,
            [
              productId, 
              variant.size.trim(), 
              parseInt(variant.stock_quantity) || 0, 
              variant.sku?.trim() || null
            ]
          );
        }
      }

      await connection.commit();
      console.log(`✅ Bulk upsert ${variantsArray.length} variants for product ${productId}`);

      return true;
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error bulk upserting variants:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ==========================================
  // 📊 Lấy tổng tồn kho của sản phẩm
  // ==========================================
  static async getTotalStock(productId) {
    try {
      const [rows] = await db.execute(
        'SELECT COALESCE(SUM(stock_quantity), 0) as total_stock FROM product_variants WHERE product_id = ?',
        [productId]
      );
      return rows[0].total_stock;
    } catch (error) {
      console.error('❌ Error getting total stock:', error);
      throw error;
    }
  }

  // ==========================================
  // 🔍 Kiểm tra size có sẵn hàng không
  // ==========================================
  static async checkAvailability(productId, size) {
    try {
      const [rows] = await db.execute(
        'SELECT stock_quantity, is_active FROM product_variants WHERE product_id = ? AND size = ?',
        [productId, size]
      );

      if (rows.length === 0) return { available: false, stock: 0 };

      return {
        available: rows[0].is_active === 1 && rows[0].stock_quantity > 0,
        stock: rows[0].stock_quantity,
        is_active: rows[0].is_active
      };
    } catch (error) {
      console.error('❌ Error checking availability:', error);
      throw error;
    }
  }

  // ==========================================
  // 📉 Giảm stock khi đặt hàng
  // ==========================================
  static async decreaseStock(productId, size, quantity) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Lock row để tránh race condition
      const [rows] = await connection.execute(
        'SELECT stock_quantity FROM product_variants WHERE product_id = ? AND size = ? FOR UPDATE',
        [productId, size]
      );

      if (rows.length === 0) {
        throw new Error(`Không tìm thấy size ${size} cho sản phẩm này`);
      }

      const currentStock = rows[0].stock_quantity;

      if (currentStock < quantity) {
        throw new Error(`Không đủ hàng. Còn ${currentStock}, yêu cầu ${quantity}`);
      }

      await connection.execute(
        'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND size = ?',
        [quantity, productId, size]
      );

      await connection.commit();
      console.log(`✅ Decreased stock: Product ${productId}, Size ${size}, Qty ${quantity}`);

      return true;
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error decreasing stock:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = ProductVariant;

