// Standardized response handlers for API endpoints

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Data to send in response
 * @param {String} message - Optional success message
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const sendSuccessResponse = (res, data = null, message = 'Success', statusCode = 200) => {
    const response = {
        success: true
    };

    if (message) {
        response.message = message;
    }

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {String} error - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 */
const sendErrorResponse = (res, error = 'Internal server error', statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        error: error
    });
};

module.exports = {
    sendSuccessResponse,
    sendErrorResponse
};
