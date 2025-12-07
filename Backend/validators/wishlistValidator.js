const { body } = require('express-validator');

const wishlistValidation = {
    validateAddItem: [
        body('product_id')
            .notEmpty()
            .withMessage('Product ID is required')
            .isInt({ min: 1 })
            .withMessage('Product ID must be a positive integer')
    ]
};

module.exports = wishlistValidation;
