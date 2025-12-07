const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const productColorController = require('../controllers/productColorController');
const productImageController = require('../controllers/productImageController');
const productVariantController = require('../controllers/productVariantController');
const productValidation = require('../validators/productValidator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', productController.getAll);
router.get('/featured', productController.getFeatured);
router.get('/search', productController.search);
router.get('/category/:categorySlug', productController.getByCategory); // Lấy sản phẩm theo category slug
router.get('/id/:id', productController.getById);
router.get('/slug/:slug', productController.getBySlug);

// 🎾 Badminton-specific product categories
router.get('/badminton-rackets', productController.getBadmintonRackets);
router.get('/shuttlecocks', productController.getShuttlecocks);
router.get('/shoes', productController.getBadmintonShoes);
router.get('/accessories', productController.getBadmintonAccessories);

// Admin routes - Image upload
router.post('/upload-image', 
    authenticateToken, 
    requireAdmin,
    upload.single('image'),
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No image file provided'
                });
            }
            
            // Return the image URL
            const imageUrl = `/uploads/products/${req.file.filename}`;
            res.json({
                success: true,
                data: {
                    url: imageUrl,
                    filename: req.file.filename
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Error uploading image'
            });
        }
    }
);

// Admin routes - Product CRUD
router.post('/', 
    authenticateToken, 
    requireAdmin, 
    productValidation.create, 
    productController.create
);

router.put('/:id', 
    authenticateToken, 
    requireAdmin, 
    productValidation.update, 
    productController.update
);

router.delete('/:id', 
    authenticateToken, 
    requireAdmin, 
    productController.delete
);

router.get('/admin/low-stock', 
    authenticateToken, 
    requireAdmin, 
    productController.getLowStock
);

// =====================================================
// Product Colors Routes (Public & Admin)
// =====================================================

// Public: Get colors for a product
router.get('/:productId/colors', productColorController.getProductColors);

// Public: Get images by color
router.get('/:productId/colors/:colorId/images', productColorController.getImagesByColor);

// Admin: Create color
router.post('/:productId/colors', 
    authenticateToken, 
    requireAdmin, 
    productColorController.createColor
);

// Admin: Update color
router.put('/colors/:colorId', 
    authenticateToken, 
    requireAdmin, 
    productColorController.updateColor
);

// Admin: Delete color
router.delete('/colors/:colorId', 
    authenticateToken, 
    requireAdmin, 
    productColorController.deleteColor
);

// Admin: Update color sort orders
router.put('/colors/sort-orders', 
    authenticateToken, 
    requireAdmin, 
    productColorController.updateColorSortOrders
);

// =====================================================
// Product Images Routes (Public & Admin)
// =====================================================

// Public: Get all images for a product
router.get('/:productId/images', productImageController.getProductImages);

// Admin: Create image
router.post('/:productId/images', 
    authenticateToken, 
    requireAdmin, 
    productImageController.createImage
);

// Admin: Update image
router.put('/images/:imageId', 
    authenticateToken, 
    requireAdmin, 
    productImageController.updateImage
);

// Admin: Delete image
router.delete('/images/:imageId', 
    authenticateToken, 
    requireAdmin, 
    productImageController.deleteImage
);

// =====================================================
// Product Variants Routes (Public & Admin)
// =====================================================

// Public: Get all variants for a product
router.get('/:productId/variants', productVariantController.getProductVariants);

// Public: Get variants by color
router.get('/:productId/colors/:colorId/variants', productVariantController.getVariantsByColor);

// Public: Get available sizes for a color
router.get('/:productId/colors/:colorId/available-sizes', productVariantController.getAvailableSizes);

// Public: Get total stock by color
router.get('/:productId/colors/:colorId/total-stock', productVariantController.getTotalStockByColor);

// Public: Get specific variant
router.get('/variants/:variantId', productVariantController.getVariant);

// Admin: Create single variant
router.post('/:productId/variants', 
    authenticateToken, 
    requireAdmin, 
    productVariantController.createVariant
);

// Admin: Create bulk variants (nhiều variants cùng lúc)
router.post('/variants/bulk', 
    authenticateToken, 
    requireAdmin, 
    productVariantController.createBulkVariants
);

// Admin: Update variant
router.put('/variants/:variantId', 
    authenticateToken, 
    requireAdmin, 
    productVariantController.updateVariant
);

// Admin: Delete variant
router.delete('/variants/:variantId', 
    authenticateToken, 
    requireAdmin, 
    productVariantController.deleteVariant
);

// Admin: Check stock availability
router.post('/variants/:variantId/check-stock', 
    authenticateToken, 
    requireAdmin, 
    productVariantController.checkStock
);

// Admin: Update stock (trừ/cộng số lượng)
router.patch('/variants/:variantId/stock', 
    authenticateToken, 
    requireAdmin, 
    productVariantController.updateStock
);

module.exports = router;