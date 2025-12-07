const Banner = require('../models/Banner');

const bannerController = {
    // Get all banners (Admin - include inactive)
    getAllBannersAdmin: async (req, res) => {
        try {
            const banners = await Banner.findAll(true);
            
            res.status(200).json({
                success: true,
                message: 'Banners retrieved successfully',
                data: banners
            });
        } catch (error) {
            console.error('Error in getAllBannersAdmin:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch banners',
                error: error.message
            });
        }
    },

    // Get active banners only (Public)
    getActiveBanners: async (req, res) => {
        try {
            const banners = await Banner.getActive();
            
            res.status(200).json({
                success: true,
                message: 'Active banners retrieved successfully',
                data: banners
            });
        } catch (error) {
            console.error('Error in getActiveBanners:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch active banners',
                error: error.message
            });
        }
    },

    // Get banner by ID
    getBannerById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid banner ID'
                });
            }

            const banner = await Banner.findById(parseInt(id));

            if (!banner) {
                return res.status(404).json({
                    success: false,
                    message: 'Banner not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Banner retrieved successfully',
                data: banner
            });
        } catch (error) {
            console.error('Error in getBannerById:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch banner',
                error: error.message
            });
        }
    },

    // Create new banner
    createBanner: async (req, res) => {
        try {
            const {
                title,
                subtitle,
                tag_text,
                tag_type,
                button_text,
                button_link,
                background_image,
                background_gradient,
                is_active,
                sort_order
            } = req.body;

            // Chỉ cần có hình ảnh là đủ, các trường khác không bắt buộc
            const hasImage = background_image && background_image.trim() !== '';
            
            if (!hasImage) {
                return res.status(400).json({
                    success: false,
                    message: 'Phải có hình ảnh banner'
                });
            }

            const bannerData = {
                title: title || '',
                subtitle: subtitle || '',
                tag_text: tag_text || '',
                tag_type: tag_type || '',
                button_text: button_text || '',
                button_link: button_link || '',
                background_image: background_image,
                background_gradient: background_gradient || null,
                is_active: is_active !== undefined ? is_active : 1,
                sort_order: sort_order || 0
            };

            const newBanner = await Banner.create(bannerData);

            res.status(201).json({
                success: true,
                message: 'Banner created successfully',
                data: newBanner
            });
        } catch (error) {
            console.error('Error in createBanner:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create banner',
                error: error.message
            });
        }
    },

    // Update banner
    updateBanner: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                title,
                subtitle,
                tag_text,
                tag_type,
                button_text,
                button_link,
                background_image,
                background_gradient,
                is_active,
                sort_order
            } = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid banner ID'
                });
            }

            // Check if banner exists
            const existingBanner = await Banner.findById(parseInt(id));
            if (!existingBanner) {
                return res.status(404).json({
                    success: false,
                    message: 'Banner not found'
                });
            }

            // Khi update, nếu có hình ảnh mới thì dùng, không thì giữ cũ
            // Không bắt buộc phải có đầy đủ các trường
            const updateData = {};
            
            if (title !== undefined) updateData.title = title;
            if (subtitle !== undefined) updateData.subtitle = subtitle;
            if (tag_text !== undefined) updateData.tag_text = tag_text;
            if (tag_type !== undefined) updateData.tag_type = tag_type;
            if (button_text !== undefined) updateData.button_text = button_text;
            if (button_link !== undefined) updateData.button_link = button_link;
            if (background_image !== undefined) updateData.background_image = background_image;
            if (background_gradient !== undefined) updateData.background_gradient = background_gradient;
            if (is_active !== undefined) updateData.is_active = is_active;
            if (sort_order !== undefined) updateData.sort_order = sort_order;

            // Merge với dữ liệu cũ
            const bannerData = {
                ...existingBanner,
                ...updateData
            };

            const updated = await Banner.update(parseInt(id), bannerData);

            if (!updated) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update banner'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Banner updated successfully',
                data: { banner_id: parseInt(id), ...bannerData }
            });
        } catch (error) {
            console.error('Error in updateBanner:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update banner',
                error: error.message
            });
        }
    },

    // Toggle banner active status
    toggleBannerStatus: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid banner ID'
                });
            }

            const toggled = await Banner.toggleActive(parseInt(id));

            if (!toggled) {
                return res.status(404).json({
                    success: false,
                    message: 'Banner not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Banner status toggled successfully'
            });
        } catch (error) {
            console.error('Error in toggleBannerStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to toggle banner status',
                error: error.message
            });
        }
    },

    // Update banner sort order
    updateBannerOrder: async (req, res) => {
        try {
            const { banners } = req.body;

            if (!Array.isArray(banners) || banners.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid banners array'
                });
            }

            // Validate each banner has banner_id and sort_order
            for (const banner of banners) {
                if (!banner.banner_id || banner.sort_order === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each banner must have banner_id and sort_order'
                    });
                }
            }

            const updated = await Banner.batchUpdateSortOrder(banners);

            if (!updated) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update banner order'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Banner order updated successfully'
            });
        } catch (error) {
            console.error('Error in updateBannerOrder:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update banner order',
                error: error.message
            });
        }
    },

    // Delete banner
    deleteBanner: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid banner ID'
                });
            }

            const deleted = await Banner.delete(parseInt(id));

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Banner not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Banner deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteBanner:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete banner',
                error: error.message
            });
        }
    }
};

module.exports = bannerController;
