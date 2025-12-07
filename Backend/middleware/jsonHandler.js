// Middleware to handle JSON parsing errors
const handleJSONError = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('🚨 JSON Parsing Error:', {
            error: err.message,
            body: err.body,
            url: req.url,
            method: req.method,
            contentType: req.headers['content-type']
        });

        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format in request body',
            error: {
                type: 'JSON_PARSE_ERROR',
                details: err.message,
                received_body: err.body,
                tips: [
                    'Check for missing values after colons',
                    'Ensure all strings are properly quoted',
                    'Verify proper comma placement',
                    'Remove trailing commas'
                ]
            },
            expected_format: {
                product_id: 1,
                quantity: 2,
                selected_attributes: {
                    size: 'M',
                    color: 'Red'
                }
            }
        });
    }

    next(err);
};

// Middleware to validate content type
const validateContentType = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.headers['content-type'];
        
        if (!contentType) {
            return res.status(400).json({
                success: false,
                message: 'Content-Type header is required',
                expected: 'application/json'
            });
        }

        if (!contentType.includes('application/json')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Content-Type. Expected application/json',
                received: contentType
            });
        }
    }
    
    next();
};

module.exports = {
    handleJSONError,
    validateContentType
};