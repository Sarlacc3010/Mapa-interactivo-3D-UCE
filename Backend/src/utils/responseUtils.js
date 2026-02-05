/**
 * Utilidades para estandarizar respuestas HTTP
 */

/**
 * Envía una respuesta exitosa
 * @param {Object} res - Objeto response de Express
 * @param {any} data - Datos a enviar
 * @param {string} message - Mensaje opcional
 * @param {number} statusCode - Código HTTP (default: 200)
 */
function sendSuccess(res, data, message = null, statusCode = 200) {
    const response = message
        ? { success: true, message, data }
        : data;

    return res.status(statusCode).json(response);
}

/**
 * Envía una respuesta de error
 * @param {Object} res - Objeto response de Express
 * @param {string|Error} error - Mensaje de error o objeto Error
 * @param {number} statusCode - Código HTTP (default: 500)
 */
function sendError(res, error, statusCode = 500) {
    const errorMessage = error instanceof Error ? error.message : error;

    console.error(`❌ Error [${statusCode}]:`, errorMessage);

    return res.status(statusCode).json({
        success: false,
        error: errorMessage
    });
}

/**
 * Envía una respuesta de recurso no encontrado
 * @param {Object} res - Objeto response de Express
 * @param {string} resource - Nombre del recurso no encontrado
 */
function sendNotFound(res, resource = 'Recurso') {
    return res.status(404).json({
        success: false,
        error: `${resource} no encontrado`
    });
}

/**
 * Envía una respuesta de error de validación
 * @param {Object} res - Objeto response de Express
 * @param {string|Object} errors - Errores de validación
 */
function sendValidationError(res, errors) {
    const errorMessage = typeof errors === 'string'
        ? errors
        : 'Errores de validación';

    return res.status(400).json({
        success: false,
        error: errorMessage,
        details: typeof errors === 'object' ? errors : undefined
    });
}

/**
 * Envía una respuesta de creación exitosa
 * @param {Object} res - Objeto response de Express
 * @param {any} data - Datos del recurso creado
 * @param {string} message - Mensaje opcional
 */
function sendCreated(res, data, message = 'Recurso creado exitosamente') {
    return sendSuccess(res, data, message, 201);
}

/**
 * Envía una respuesta de eliminación exitosa
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de confirmación
 */
function sendDeleted(res, message = 'Recurso eliminado exitosamente') {
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
