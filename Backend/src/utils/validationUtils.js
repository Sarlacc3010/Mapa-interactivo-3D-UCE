/**
 * Utilities for common validations
 */

/**
 * Validates that all required fields are present
 * @param {Object} data - Object with data to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {Object} - { isValid: boolean, missing: string[] }
 */
function validateRequiredFields(data, requiredFields) {
    const missing = [];

    for (const field of requiredFields) {
        if (!data[field] && data[field] !== 0 && data[field] !== false) {
            missing.push(field);
        }
    }

    return {
        isValid: missing.length === 0,
        missing,
        message: missing.length > 0
            ? `Missing required fields: ${missing.join(', ')}`
            : null
    };
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates that a date is valid
 * @param {string|Date} date - Date to validate
 * @returns {boolean}
 */
function validateDate(date) {
    if (!date) return false;

    const dateObj = date instanceof Date ? date : new Date(date);
    return !isNaN(dateObj.getTime());
}

/**
 * Validates that a date range is valid (start <= end)
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {Object} - { isValid: boolean, message: string }
 */
function validateDateRange(startDate, endDate) {
    if (!validateDate(startDate)) {
        return { isValid: false, message: 'Invalid start date' };
    }

    if (!validateDate(endDate)) {
        return { isValid: false, message: 'Invalid end date' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
        return { isValid: false, message: 'Start date must be before end date' };
    }

    return { isValid: true, message: null };
}

/**
 * Validates that an ID is a valid number
 * @param {any} id - ID to validate
 * @returns {boolean}
 */
function validateId(id) {
    const numId = parseInt(id);
    return !isNaN(numId) && numId > 0;
}

/**
 * Validates string length
 * @param {string} str - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {Object} - { isValid: boolean, message: string }
 */
function validateStringLength(str, min = 0, max = Infinity) {
    if (typeof str !== 'string') {
        return { isValid: false, message: 'Must be a text' };
    }

    const length = str.trim().length;

    if (length < min) {
        return { isValid: false, message: `Must have at least ${min} characters` };
    }

    if (length > max) {
        return { isValid: false, message: `Must have at most ${max} characters` };
    }

    return { isValid: true, message: null };
}

/**
 * Sanitizes a string removing dangerous characters
 * @param {string} str - String to sanitize
 * @returns {string}
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return '';

    return str
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+=/gi, ''); // Remove event handlers
}

module.exports = {
    validateRequiredFields,
    validateEmail,
    validateDate,
    validateDateRange,
    validateId,
    validateStringLength,
    sanitizeString
};
