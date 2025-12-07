const ProductImage = require('../models/ProductImage');

// Get all images for a product
exports.getProductImages = async (req, res) => {
    try {
        const { productId } = req.params;
        const images = await ProductImage.getByProductId(productId);
        
        res.json({
            success: true,
            data: images
        });
    } catch (error) {
        console.error('Get product images error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create new image
exports.createImage = async (req, res) => {
    try {
        const { productId } = req.params;
        const { image_url, is_primary, color_id, sort_order } = req.body;
        
        if (!image_url) {
            return res.status(400).json({
                success: false,
                message: 'image_url là bắt buộc'
            });
        }
        
        const image = await ProductImage.create({
            product_id: productId,
            image_url,
            is_primary: is_primary || false,
            color_id: color_id || null,
            sort_order: sort_order || 0
        });
        
        res.status(201).json({
            success: true,
            data: image,
            message: 'Tạo ảnh thành công'
        });
    } catch (error) {
        console.error('Create image error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update image
exports.updateImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const updateData = req.body;
        
        const image = await ProductImage.update(imageId, updateData);
        
        res.json({
            success: true,
            data: image,
            message: 'Cập nhật ảnh thành công'
        });
    } catch (error) {
        console.error('Update image error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete image
exports.deleteImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        
        await ProductImage.delete(imageId);
        
        res.json({
            success: true,
            message: 'Xóa ảnh thành công'
        });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
