const { body } = require('express-validator');

const productValidation = {
    create: [
        body('product_name')
            .notEmpty()
            .withMessage('Product name is required')
            .isLength({ min: 2, max: 255 })
            .withMessage('Product name must be between 2 and 255 characters'),

        body('description')
            .optional({ nullable: true, checkFalsy: true })
            .isLength({ min: 10 })
            .withMessage('Description must be at least 10 characters if provided'),

        body('short_description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Short description cannot exceed 500 characters'),

        body('sku')
            .optional() // Cho phép không có SKU, sẽ auto-generate
            .isLength({ min: 3, max: 100 })
            .withMessage('SKU must be between 3 and 100 characters')
            .matches(/^[A-Z0-9\-]+$/)
            .withMessage('SKU can only contain uppercase letters, numbers, and hyphens'),

        body('category_id')
            .notEmpty()
            .withMessage('Category is required')
            .isInt({ min: 1 })
            .withMessage('Category ID must be a positive integer'),

        body('brand_id')
            .notEmpty()
            .withMessage('Brand is required')
            .isInt({ min: 1 })
            .withMessage('Brand ID must be a positive integer'),

        // Cho phép cả base_price và price
        body('base_price')
            .optional()
            .custom((value, { req }) => {
                // Ít nhất phải có base_price hoặc price
                if (!value && !req.body.price) {
                    throw new Error('Either base_price or price is required');
                }
                // Nếu có giá trị, phải là số dương
                if (value !== undefined && value !== null && value !== '') {
                    const numValue = Number(value);
                    if (isNaN(numValue) || numValue < 0) {
                        throw new Error('Base price must be a positive number');
                    }
                }
                return true;
            }),
            
        body('price')
            .optional()
            .custom((value) => {
                // Nếu có giá trị, phải là số dương
                if (value !== undefined && value !== null && value !== '') {
                    const numValue = Number(value);
                    if (isNaN(numValue) || numValue < 0) {
                        throw new Error('Price must be a positive number');
                    }
                }
                return true;
            }),

        body('sale_price')
            .optional({ nullable: true, checkFalsy: true })
            .customSanitizer(value => {
                // Convert null/undefined/empty to undefined so validation skips
                if (value === null || value === undefined || value === '') {
                    return undefined;
                }
                return value;
            })
            .custom((value) => {
                // This won't run if value is undefined (from sanitizer above)
                if (value === undefined) {
                    return true;
                }
                
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < 0) {
                    throw new Error('Sale price must be a positive number');
                }
                return true;
            }),

        body('stock_quantity')
            .optional({ nullable: true, checkFalsy: true })
            .custom((value) => {
                if (value !== undefined && value !== null && value !== '') {
                    const numValue = Number(value);
                    if (!Number.isInteger(numValue) || numValue < 0) {
                        throw new Error('Stock quantity must be a non-negative integer');
                    }
                }
                return true;
            }),

        body('weight')
            .optional({ nullable: true, checkFalsy: true })
            .custom((value) => {
                if (value !== undefined && value !== null && value !== '') {
                    const numValue = Number(value);
                    if (isNaN(numValue) || numValue < 0) {
                        throw new Error('Weight must be a positive number');
                    }
                }
                return true;
            }),

        body('dimensions')
            .optional()
            .matches(/^\d+(\.\d+)?\s*x\s*\d+(\.\d+)?\s*x\s*\d+(\.\d+)?(\s*(cm|mm|m))?$/i)
            .withMessage('Dimensions must be in format "LxWxH" (e.g., "30x20x15 cm")'),

        body('material')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Material cannot exceed 255 characters'),

        body('status')
            .optional()
            .isIn(['active', 'inactive', 'draft', 'out_of_stock'])
            .withMessage('Status must be one of: active, inactive, draft, out_of_stock'),

        body('is_featured')
            .optional()
            .isBoolean()
            .withMessage('is_featured must be a boolean'),

        body('meta_title')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Meta title cannot exceed 255 characters'),

        body('meta_description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Meta description cannot exceed 500 characters'),

        body('meta_keywords')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Meta keywords cannot exceed 500 characters'),

        body('images')
            .optional()
            .isArray()
            .withMessage('Images must be an array'),

        body('images.*.url')
            .optional()
            .isURL()
            .withMessage('Image URL must be valid'),

        body('attributes')
            .optional()
            .isArray()
            .withMessage('Attributes must be an array'),

        body('attributes.*.name')
            .optional()
            .notEmpty()
            .withMessage('Attribute name is required'),

        body('attributes.*.value')
            .optional()
            .notEmpty()
            .withMessage('Attribute value is required')
    ],

    update: [
        body('name')
            .optional()
            .isLength({ min: 2, max: 255 })
            .withMessage('Product name must be between 2 and 255 characters'),

        body('description')
            .optional({ nullable: true, checkFalsy: true })
            .isLength({ min: 10 })
            .withMessage('Description must be at least 10 characters if provided'),

        body('short_description')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Short description cannot exceed 500 characters'),

        body('category_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Category ID must be a positive integer'),

        body('brand_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Brand ID must be a positive integer'),

        body('price')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),

        body('sale_price')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Sale price must be a positive number'),

        body('stock_quantity')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Stock quantity must be a non-negative integer'),

        body('weight')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Weight must be a positive number'),

        body('material')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Material cannot exceed 255 characters'),

        body('status')
            .optional()
            .isIn(['active', 'inactive', 'draft', 'out_of_stock'])
            .withMessage('Status must be one of: active, inactive, draft, out_of_stock'),

        body('is_featured')
            .optional()
            .isBoolean()
            .withMessage('is_featured must be a boolean')
    ]
};

module.exports = productValidation;