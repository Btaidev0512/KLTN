const ProductColor = require('../models/ProductColor');

// Get colors for a product
exports.getProductColors = async (req, res) => {
    try {
        const { productId } = req.params;
        const colors = await ProductColor.getByProductId(productId);
        
        res.json({
            success: true,
            data: colors
        });
    } catch (error) {
        console.error('Get product colors error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create new color
exports.createColor = async (req, res) => {
    try {
        const { productId } = req.params; // Lấy từ URL params
        const { color_name, color_code, stock_quantity, sort_order } = req.body;
        
        if (!productId || !color_name || !color_code) {
            return res.status(400).json({
                success: false,
                message: 'color_name và color_code là bắt buộc'
            });
        }
        
        const color = await ProductColor.create({
            product_id: productId, // Sử dụng productId từ URL
            color_name,
            color_code,
            stock_quantity: stock_quantity || 0,
            sort_order: sort_order || 0
        });
        
        res.status(201).json({
            success: true,
            data: color,
            message: 'Tạo màu sắc thành công'
        });
    } catch (error) {
        console.error('Create color error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update color
exports.updateColor = async (req, res) => {
    try {
        const { colorId } = req.params;
        const updateData = req.body;
        
        const color = await ProductColor.update(colorId, updateData);
        
        res.json({
            success: true,
            data: color,
            message: 'Cập nhật màu sắc thành công'
        });
    } catch (error) {
        console.error('Update color error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete color
exports.deleteColor = async (req, res) => {
    try {
        const { colorId } = req.params;
        
        await ProductColor.delete(colorId);
        
        res.json({
            success: true,
            message: 'Xóa màu sắc thành công'
        });
    } catch (error) {
        console.error('Delete color error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get images by color
exports.getImagesByColor = async (req, res) => {
    try {
        const { productId, colorId } = req.params;
        const images = await ProductColor.getImagesByColor(productId, colorId);
        
        res.json({
            success: true,
            data: images
        });
    } catch (error) {
        console.error('Get images by color error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update sort orders
exports.updateColorSortOrders = async (req, res) => {
    try {
        const { orders } = req.body;
        
        if (!Array.isArray(orders)) {
            return res.status(400).json({
                success: false,
                message: 'orders phải là array'
            });
        }
        
        await ProductColor.updateSortOrders(orders);
        
        res.json({
            success: true,
            message: 'Cập nhật thứ tự thành công'
        });
    } catch (error) {
        console.error('Update sort orders error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
