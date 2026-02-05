const { client: redisClient } = require('../config/redis');

/**
 * Obtiene datos del caché de Redis
 * @param {string} key - Clave del caché
 * @returns {Promise<any|null>} - Datos parseados o null si no existe/error
 */
async function getCachedData(key) {
    if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis no disponible para lectura');
        return null;
    }

    try {
        const cached = await redisClient.get(key);
        if (cached) {
            console.log(`🚀 [CACHE HIT] Clave: ${key}`);
            return JSON.parse(cached);
        }
        return null;
    } catch (error) {
        console.error(`❌ Error leyendo caché [${key}]:`, error.message);
        return null;
    }
}

/**
 * Guarda datos en el caché de Redis
 * @param {string} key - Clave del caché
 * @param {any} data - Datos a guardar (serán stringify)
 * @param {number} ttl - Tiempo de vida en segundos (default: 3600 = 1 hora)
 * @returns {Promise<boolean>} - true si se guardó exitosamente
 */
async function setCachedData(key, data, ttl = 3600) {
    if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis no disponible para escritura');
        return false;
    }

    try {
        await redisClient.setEx(key, ttl, JSON.stringify(data));
        console.log(`💾 [CACHE SAVE] Clave: ${key}, TTL: ${ttl}s`);
        return true;
    } catch (error) {
        console.error(`❌ Error guardando caché [${key}]:`, error.message);
        return false;
    }
}

/**
 * Invalida (elimina) una o varias claves del caché
 * @param {string|string[]} keys - Clave(s) a invalidar
 * @returns {Promise<boolean>} - true si se invalidó exitosamente
 */
async function invalidateCache(keys) {
    if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis no disponible para invalidación');
        return false;
    }

    try {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        await redisClient.del(keyArray);
        console.log(`🗑️ [CACHE INVALIDATE] Claves: ${keyArray.join(', ')}`);
        return true;
    } catch (error) {
        console.error(`❌ Error invalidando caché:`, error.message);
        return false;
    }
}

/**
 * Wrapper para operaciones con caché automático
 * Intenta obtener del caché, si no existe ejecuta la función y guarda el resultado
 * @param {string} key - Clave del caché
 * @param {Function} fetchFn - Función async que obtiene los datos si no están en caché
 * @param {number} ttl - Tiempo de vida en segundos (default: 3600)
 * @returns {Promise<any>} - Datos del caché o de la función
 */
async function withCache(key, fetchFn, ttl = 3600) {
    // Intentar obtener del caché
    const cached = await getCachedData(key);
    if (cached !== null) {
        return cached;
    }

    // Si no está en caché, ejecutar función
    console.log(`🐢 [DB READ] Ejecutando función para clave: ${key}`);
    const data = await fetchFn();

    // Guardar en caché
    await setCachedData(key, data, ttl);

    return data;
}

module.exports = {
    getCachedData,
    setCachedData,
    invalidateCache,
    withCache
};
