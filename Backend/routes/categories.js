const express = require('express');
const {
  getCategories,
  getParentCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  searchCategories,
  reorderCategories
} = require('../controllers/categoryController');

const { protect, authorize } = require('../middleware/auth');
const { validateCategory } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/search', searchCategories);
router.get('/parents', getParentCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);
router.get('/', getCategories);

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', validateCategory, createCategory);
router.put('/:id', validateCategory, updateCategory);
router.patch('/reorder', reorderCategories);
router.delete('/:id', deleteCategory);

module.exports = router;