/**
 * Utilities to standardize HTTP responses
 */

/**
 * Sends a success response
 * @param {Object} res - Express response object
 * @param {any} data - Data to send
 * @param {string} message - Optional message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function sendSuccess(res, data, message = null, statusCode = 200) {
    const response = message
        ? { success: true, message, data }
        : data;

    return res.status(statusCode).json(response);
}

/**
 * Sends an error response
 * @param {Object} res - Express response object
 * @param {string|Error} error - Error message or Error object
 * @param {number} statusCode - HTTP status code (default: 500)
 */
function sendError(res, error, statusCode = 500) {
    const errorMessage = error instanceof Error ? error.message : error;

    console.error(`Error [${statusCode}]:`, errorMessage);

    return res.status(statusCode).json({
        success: false,
        error: errorMessage
    });
}

/**
 * Sends a resource not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Name of the not found resource
 */
function sendNotFound(res, resource = 'Recurso') {
    return res.status(404).json({
        success: false,
        error: `${resource} not found`
    });
}

/**
 * Sends a validation error response
 * @param {Object} res - Express response object
 * @param {string|Object} errors - Validation errors
 */
function sendValidationError(res, errors) {
    const errorMessage = typeof errors === 'string'
        ? errors
        : 'Validation errors';

    return res.status(400).json({
        success: false,
        error: errorMessage,
        details: typeof errors === 'object' ? errors : undefined
    });
}

/**
 * Sends a creation success response
 * @param {Object} res - Express response object
 * @param {any} data - Created resource data
 * @param {string} message - Optional message
 */
function sendCreated(res, data, message = 'Resource created successfully') {
    return sendSuccess(res, data, message, 201);
}

/**
 * Sends a deletion success response
 * @param {Object} res - Express response object
 * @param {string} message - Confirmation message
 */
function sendDeleted(res, message = 'Resource deleted successfully') {
    return res.status(200).json({
        success: true,
        message
    });
}

module.exports = {
    sendSuccess,
    sendError,
    sendNotFound,
    sendValidationError,
    sendCreated,
    sendDeleted
};
