const { body } = require('express-validator');

const brandValidation = {
    create: [
        body('name')
            .notEmpty()
            .withMessage('Brand name is required')
            .isLength({ min: 2, max: 255 })
            .withMessage('Brand name must be between 2 and 255 characters')
            .matches(/^[a-zA-Z0-9\s\-&.]+$/)
            .withMessage('Brand name contains invalid characters'),

        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description cannot exceed 1000 characters'),

        body('logo_url')
            .optional()
            .isURL()
            .withMessage('Logo URL must be a valid URL'),

        body('website')
            .optional()
            .isURL()
            .withMessage('Website must be a valid URL'),

        body('country')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Country cannot exceed 100 characters'),

        body('founded_year')
            .optional()
            .isInt({ min: 1800, max: new Date().getFullYear() })
            .withMessage('Founded year must be between 1800 and current year'),

        body('is_active')
            .optional()
            .isBoolean()
            .withMessage('is_active must be a boolean'),

        body('sort_order')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Sort order must be a non-negative integer')
    ],

    update: [
        body('name')
            .optional()
            .isLength({ min: 2, max: 255 })
            .withMessage('Brand name must be between 2 and 255 characters')
            .matches(/^[a-zA-Z0-9\s\-&.]+$/)
            .withMessage('Brand name contains invalid characters'),

        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description cannot exceed 1000 characters'),

        body('logo_url')
            .optional()
            .isURL()
            .withMessage('Logo URL must be a valid URL'),

        body('website')
            .optional()
            .isURL()
            .withMessage('Website must be a valid URL'),

        body('country')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Country cannot exceed 100 characters'),

        body('founded_year')
            .optional()
            .isInt({ min: 1800, max: new Date().getFullYear() })
            .withMessage('Founded year must be between 1800 and current year'),

        body('is_active')
            .optional()
            .isBoolean()
            .withMessage('is_active must be a boolean'),

        body('sort_order')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Sort order must be a non-negative integer')
    ]
};

module.exports = brandValidation;