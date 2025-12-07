const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const { tree = 'false', include_inactive = 'false' } = req.query;
    
    let categories;
    if (tree === 'true') {
      categories = await Category.getCategoryTree();
    } else {
      categories = await Category.findAll(include_inactive === 'true');
    }

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// @desc    Get parent categories only (main sports)
// @route   GET /api/categories/parents
// @access  Public
const getParentCategories = async (req, res) => {
  try {
    const { include_inactive = 'false' } = req.query;
    const categories = await Category.findParents(include_inactive === 'true');

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get parent categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parent categories',
      error: error.message
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get child categories
    const children = await Category.findChildren(id);

    res.status(200).json({
      success: true,
      data: {
        ...category,
        children
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findBySlug(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get child categories
    const children = await Category.findChildren(category.id);

    res.status(200).json({
      success: true,
      data: {
        ...category,
        children
      }
    });
  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    // Debug logging
    console.log('📝 Create Category - Request Body:', JSON.stringify(req.body, null, 2));
    
    // Accept both 'name' and 'category_name' for backward compatibility
    const { 
      name, 
      category_name,
      description, 
      image_url, 
      parent_id, 
      sort_order 
    } = req.body;

    const categoryName = name || category_name;
    
    console.log('📝 Extracted categoryName:', categoryName);

    // Validate required field
    if (!categoryName || !categoryName.trim()) {
      console.log('❌ Validation failed: Category name is empty');
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if parent category exists (if provided)
    if (parent_id) {
      const parentCategory = await Category.findById(parent_id);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    const categoryId = await Category.create({
      name: categoryName,
      description,
      image_url,
      parent_id,
      sort_order
    });

    const category = await Category.findById(categoryId);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Accept both 'name' and 'category_name'
    if (updateData.category_name && !updateData.name) {
      updateData.name = updateData.category_name;
    }

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if parent category exists (if provided)
    if (updateData.parent_id) {
      const parentCategory = await Category.findById(updateData.parent_id);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }

      // Prevent setting self as parent
      if (updateData.parent_id == id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }
    }

    const updated = await Category.update(id, updateData);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update category'
      });
    }

    const category = await Category.findById(id);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await Category.delete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete category'
    });
  }
};

// @desc    Search categories
// @route   GET /api/categories/search
// @access  Public
const searchCategories = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const categories = await Category.search(q, parseInt(limit));

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Search categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search categories',
      error: error.message
    });
  }
};

// @desc    Reorder categories
// @route   PATCH /api/categories/reorder
// @access  Private/Admin
const reorderCategories = async (req, res) => {
  try {
    const { orders } = req.body; // Array of {id, sort_order}
    
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orders array is required'
      });
    }

    await Category.updateSortOrders(orders);

    res.status(200).json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder categories',
      error: error.message
    });
  }
};

module.exports = {
  getCategories,
  getParentCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  searchCategories,
  reorderCategories
};