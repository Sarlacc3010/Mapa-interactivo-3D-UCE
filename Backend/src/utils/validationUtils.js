/**
 * Utilidades para validaciones comunes
 */

/**
 * Valida que todos los campos requeridos estén presentes
 * @param {Object} data - Objeto con los datos a validar
 * @param {string[]} requiredFields - Array de nombres de campos requeridos
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
            ? `Faltan campos obligatorios: ${missing.join(', ')}`
            : null
    };
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida que una fecha sea válida
 * @param {string|Date} date - Fecha a validar
 * @returns {boolean}
 */
function validateDate(date) {
    if (!date) return false;

    const dateObj = date instanceof Date ? date : new Date(date);
    return !isNaN(dateObj.getTime());
}

/**
 * Valida que un rango de fechas sea válido (inicio <= fin)
 * @param {string|Date} startDate - Fecha de inicio
 * @param {string|Date} endDate - Fecha de fin
 * @returns {Object} - { isValid: boolean, message: string }
 */
function validateDateRange(startDate, endDate) {
    if (!validateDate(startDate)) {
        return { isValid: false, message: 'Fecha de inicio inválida' };
    }

    if (!validateDate(endDate)) {
        return { isValid: false, message: 'Fecha de fin inválida' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
        return { isValid: false, message: 'La fecha de inicio debe ser anterior a la fecha de fin' };
    }

    return { isValid: true, message: null };
}

/**
 * Valida que un ID sea un número válido
 * @param {any} id - ID a validar
 * @returns {boolean}
 */
function validateId(id) {
    const numId = parseInt(id);
    return !isNaN(numId) && numId > 0;
}

/**
 * Valida longitud de string
 * @param {string} str - String a validar
 * @param {number} min - Longitud mínima
 * @param {number} max - Longitud máxima
 * @returns {Object} - { isValid: boolean, message: string }
 */
function validateStringLength(str, min = 0, max = Infinity) {
    if (typeof str !== 'string') {
        return { isValid: false, message: 'Debe ser un texto' };
    }

    const length = str.trim().length;

    if (length < min) {
        return { isValid: false, message: `Debe tener al menos ${min} caracteres` };
    }

    if (length > max) {
        return { isValid: false, message: `Debe tener máximo ${max} caracteres` };
    }

    return { isValid: true, message: null };
}

/**
 * Sanitiza un string removiendo caracteres peligrosos
 * @param {string} str - String a sanitizar
 * @returns {string}
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return '';

    return str
        .trim()
        .replace(/[<>]/g, '') // Remover < y >
        .replace(/javascript:/gi, '') // Remover javascript:
        .replace(/on\w+=/gi, ''); // Remover event handlers
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
