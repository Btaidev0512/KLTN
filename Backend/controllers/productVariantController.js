const ProductVariant = require('../models/ProductVariant');

/**
 * Lấy tất cả variants của một sản phẩm
 */
exports.getProductVariants = async (req, res) => {
    try {
        const { productId } = req.params;
        const variants = await ProductVariant.getByProductId(productId);
        
        res.json({
            success: true,
            data: variants
        });
    } catch (error) {
        console.error('Get product variants error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Lấy variants theo màu sắc
 */
exports.getVariantsByColor = async (req, res) => {
    try {
        const { productId, colorId } = req.params;
        const variants = await ProductVariant.getByColor(productId, colorId);
        
        res.json({
            success: true,
            data: variants
        });
    } catch (error) {
        console.error('Get variants by color error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Lấy variant cụ thể
 */
exports.getVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        const variant = await ProductVariant.getById(variantId);
        
        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant không tồn tại'
            });
        }
        
        res.json({
            success: true,
            data: variant
        });
    } catch (error) {
        console.error('Get variant error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Tạo variant mới
 */
exports.createVariant = async (req, res) => {
    try {
        const { productId } = req.params; // Lấy từ URL
        const { color_id, size, sku, stock_quantity, price_override } = req.body;
        
        if (!productId || !color_id || !size || !sku) {
            return res.status(400).json({
                success: false,
                message: 'color_id, size và sku là bắt buộc'
            });
        }
        
        const variant = await ProductVariant.create({
            product_id: productId, // Sử dụng productId từ URL
            color_id,
            size,
            sku,
            stock_quantity: stock_quantity || 0,
            price_override: price_override || null
        });
        
        res.status(201).json({
            success: true,
            data: variant,
            message: 'Tạo variant thành công'
        });
    } catch (error) {
        console.error('Create variant error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Tạo nhiều variants cùng lúc (bulk create)
 * Body: { variants: [{product_id, color_id, size, sku, stock_quantity, price_override}, ...] }
 */
exports.createBulkVariants = async (req, res) => {
    try {
        const { variants } = req.body;
        
        if (!Array.isArray(variants) || variants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'variants phải là array và không được rỗng'
            });
        }
        
        // Validate each variant
        for (const variant of variants) {
            if (!variant.product_id || !variant.color_id || !variant.size || !variant.sku) {
                return res.status(400).json({
                    success: false,
                    message: 'Mỗi variant phải có product_id, color_id, size và sku'
                });
            }
        }
        
        const createdVariants = await ProductVariant.createBulk(variants);
        
        res.status(201).json({
            success: true,
            data: createdVariants,
            message: `Tạo thành công ${createdVariants.length} variants`
        });
    } catch (error) {
        console.error('Create bulk variants error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Cập nhật variant
 */
exports.updateVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        const updateData = req.body;
        
        const variant = await ProductVariant.update(variantId, updateData);
        
        res.json({
            success: true,
            data: variant,
            message: 'Cập nhật variant thành công'
        });
    } catch (error) {
        console.error('Update variant error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Xóa variant
 */
exports.deleteVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        
        await ProductVariant.delete(variantId);
        
        res.json({
            success: true,
            message: 'Xóa variant thành công'
        });
    } catch (error) {
        console.error('Delete variant error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Lấy sizes có sẵn cho một màu
 */
exports.getAvailableSizes = async (req, res) => {
    try {
        const { productId, colorId } = req.params;
        const sizes = await ProductVariant.getAvailableSizesByColor(productId, colorId);
        
        res.json({
            success: true,
            data: sizes
        });
    } catch (error) {
        console.error('Get available sizes error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Lấy tổng stock của một màu
 */
exports.getTotalStockByColor = async (req, res) => {
    try {
        const { productId, colorId } = req.params;
        const totalStock = await ProductVariant.getTotalStockByColor(productId, colorId);
        
        res.json({
            success: true,
            data: { total_stock: totalStock }
        });
    } catch (error) {
        console.error('Get total stock error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Kiểm tra stock có sẵn
 */
exports.checkStock = async (req, res) => {
    try {
        const { variantId } = req.params;
        const { quantity } = req.body;
        
        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'quantity phải lớn hơn 0'
            });
        }
        
        const available = await ProductVariant.checkStockAvailability(variantId, quantity);
        
        res.json({
            success: true,
            data: { available }
        });
    } catch (error) {
        console.error('Check stock error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Cập nhật stock (trừ/cộng)
 */
exports.updateStock = async (req, res) => {
    try {
        const { variantId } = req.params;
        const { quantity } = req.body;
        
        if (quantity === undefined || quantity === 0) {
            return res.status(400).json({
                success: false,
                message: 'quantity là bắt buộc và phải khác 0'
            });
        }
        
        const variant = await ProductVariant.updateStock(variantId, quantity);
        
        res.json({
            success: true,
            data: variant,
            message: 'Cập nhật stock thành công'
        });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
