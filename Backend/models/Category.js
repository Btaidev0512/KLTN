const db = require('../config/database');

class Category {
  // Get all categories with hierarchy
  static async findAll(includeInactive = false) {
    try {
      const query = `
        SELECT 
          c.category_id, 
          c.category_name, 
          c.category_slug, 
          c.description, 
          c.image_url, 
          c.parent_id, 
          c.sort_order, 
          c.is_active, 
          c.created_at, 
          c.updated_at,
          COUNT(p.product_id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.category_id = p.category_id
        ${!includeInactive ? 'WHERE c.is_active = true' : ''}
        GROUP BY c.category_id, c.category_name, c.category_slug, c.description, 
                 c.image_url, c.parent_id, c.sort_order, c.is_active, 
                 c.created_at, c.updated_at
        ORDER BY c.parent_id IS NULL DESC, c.parent_id ASC, c.sort_order ASC, c.category_name ASC
      `;
      
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Find all categories error:', error);
      throw error;
    }
  }

  // Get parent categories (main categories)
  static async findParents(includeInactive = false) {
    try {
      const query = `
        SELECT category_id, category_name, category_slug, description, 
               image_url, parent_id, sort_order, is_active, created_at, updated_at
        FROM categories 
        WHERE parent_id IS NULL ${!includeInactive ? 'AND is_active = true' : ''}
        ORDER BY sort_order ASC, category_name ASC
      `;
      
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Find parent categories error:', error);
      throw error;
    }
  }

  // Get category tree structure
  static async getCategoryTree() {
    try {
      const categories = await this.findAll();
      
      const categoryMap = {};
      const tree = [];

      // Create map of all categories
      categories.forEach(category => {
        categoryMap[category.category_id] = { ...category, children: [] };
      });

      // Build tree structure
      categories.forEach(category => {
        if (category.parent_id && categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].children.push(categoryMap[category.category_id]);
        } else if (!category.parent_id) {
          tree.push(categoryMap[category.category_id]);
        }
      });

      return tree;
    } catch (error) {
      console.error('Get category tree error:', error);
      throw error;
    }
  }

  // Get category by ID with full details
  static async findById(id) {
    try {
      const query = `
        SELECT c1.category_id, c1.category_name, c1.category_slug, c1.description, 
               c1.image_url, c1.parent_id, c1.sort_order, c1.is_active, 
               c1.created_at, c1.updated_at,
               c2.category_name as parent_name,
               c2.category_slug as parent_slug
        FROM categories c1
        LEFT JOIN categories c2 ON c1.parent_id = c2.category_id
        WHERE c1.category_id = ?
      `;
      
      const [rows] = await db.execute(query, [id]);
      return rows[0];
    } catch (error) {
      console.error('Find category by ID error:', error);
      throw error;
    }
  }

  // Get category by slug
  static async findBySlug(slug) {
    try {
      const query = `
        SELECT c1.category_id, c1.category_name, c1.category_slug, c1.description, 
               c1.image_url, c1.parent_id, c1.sort_order, c1.is_active, 
               c1.created_at, c1.updated_at,
               c2.category_name as parent_name,
               c2.category_slug as parent_slug
        FROM categories c1
        LEFT JOIN categories c2 ON c1.parent_id = c2.category_id
        WHERE c1.category_slug = ? AND c1.is_active = true
      `;
      
      const [rows] = await db.execute(query, [slug]);
      return rows[0];
    } catch (error) {
      console.error('Find category by slug error:', error);
      throw error;
    }
  }

  // Get child categories
  static async findChildren(parentId, includeInactive = false) {
    try {
      const query = `
        SELECT category_id, category_name, category_slug, description, 
               image_url, parent_id, sort_order, is_active, created_at, updated_at
        FROM categories 
        WHERE parent_id = ? ${!includeInactive ? 'AND is_active = true' : ''}
        ORDER BY sort_order ASC, category_name ASC
      `;
      
      const [rows] = await db.execute(query, [parentId]);
      return rows;
    } catch (error) {
      console.error('Find children categories error:', error);
      throw error;
    }
  }

  // Create new category
  static async create({ name, description, image_url, parent_id, sort_order }) {
    try {
      // Generate slug from name
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const query = `
        INSERT INTO categories (category_name, category_slug, description, image_url, parent_id, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, true)
      `;
      
      const [result] = await db.execute(query, [
        name,
        slug,
        description || null,
        image_url || null,
        parent_id || null,
        sort_order || 0
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  }

  // Update category
  static async update(id, { name, description, image_url, parent_id, sort_order, is_active }) {
    try {
      // Generate new slug if name changed
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const query = `
        UPDATE categories 
        SET category_name = ?,
            category_slug = ?,
            description = ?,
            image_url = ?,
            parent_id = ?,
            sort_order = ?,
            is_active = ?,
            updated_at = NOW()
        WHERE category_id = ?
      `;
      
      const [result] = await db.execute(query, [
        name,
        slug,
        description || null,
        image_url || null,
        parent_id || null,
        sort_order || 0,
        is_active !== undefined ? is_active : true,
        id
      ]);
      
      return result.affectedRows;
    } catch (error) {
      console.error('Update category error:', error);
      throw error;
    }
  }

  // Delete category
  static async delete(id) {
    try {
      // Check if category has children
      const children = await this.findChildren(id, true);
      if (children.length > 0) {
        throw new Error('Cannot delete category with subcategories');
      }

      // Check if category has products
      const [products] = await db.execute(
        'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
        [id]
      );
      
      if (products[0].count > 0) {
        throw new Error('Cannot delete category with products');
      }

      const query = 'DELETE FROM categories WHERE category_id = ?';
      const [result] = await db.execute(query, [id]);
      
      return result.affectedRows;
    } catch (error) {
      console.error('Delete category error:', error);
      throw error;
    }
  }

  // Update sort orders for multiple categories
  static async updateSortOrders(orders) {
    try {
      // Use transaction to ensure atomic updates
      const connection = await db.pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        for (const item of orders) {
          await connection.execute(
            'UPDATE categories SET sort_order = ? WHERE category_id = ?',
            [item.sort_order, item.id]
          );
        }
        
        await connection.commit();
        connection.release();
        
        return true;
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Update sort orders error:', error);
      throw error;
    }
  }
}

module.exports = Category;