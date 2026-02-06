const { client: redisClient } = require('../config/redis');

/**
 * Gets data from Redis cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Parsed data or null if not exists/error
 */
async function getCachedData(key) {
    if (!redisClient || !redisClient.isOpen) {
        console.warn('Redis not available for reading');
        return null;
    }

    try {
        const cached = await redisClient.get(key);
        if (cached) {
            console.log(`[CACHE HIT] Key: ${key}`);
            return JSON.parse(cached);
        }
        return null;
    } catch (error) {
        console.error(`Error reading cache [${key}]:`, error.message);
        return null;
    }
}

/**
 * Saves data to Redis cache
 * @param {string} key - Cache key
 * @param {any} data - Data to save (will be stringified)
 * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
 * @returns {Promise<boolean>} - true if saved successfully
 */
async function setCachedData(key, data, ttl = 3600) {
    if (!redisClient || !redisClient.isOpen) {
        console.warn('Redis not available for writing');
        return false;
    }

    try {
        await redisClient.setEx(key, ttl, JSON.stringify(data));
        console.log(`[CACHE SAVE] Key: ${key}, TTL: ${ttl}s`);
        return true;
    } catch (error) {
        console.error(`Error saving cache [${key}]:`, error.message);
        return false;
    }
}

/**
 * Invalidates (deletes) one or multiple cache keys
 * @param {string|string[]} keys - Key(s) to invalidate
 * @returns {Promise<boolean>} - true if invalidated successfully
 */
async function invalidateCache(keys) {
    if (!redisClient || !redisClient.isOpen) {
        console.warn('Redis not available for invalidation');
        return false;
    }

    try {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        await redisClient.del(keyArray);
        console.log(`[CACHE INVALIDATE] Keys: ${keyArray.join(', ')}`);
        return true;
    } catch (error) {
        console.error(`Error invalidating cache:`, error.message);
        return false;
    }
}

/**
 * Wrapper for automatic cache operations
 * Tries to get from cache, if not exists executes function and saves result
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function that gets data if not in cache
 * @param {number} ttl - Time to live in seconds (default: 3600)
 * @returns {Promise<any>} - Data from cache or function
 */
async function withCache(key, fetchFn, ttl = 3600) {
    // Try to get from cache
    const cached = await getCachedData(key);
    if (cached !== null) {
        return cached;
    }

    // If not in cache, execute function
    console.log(`[DB READ] Executing function for key: ${key}`);
    const data = await fetchFn();

    // Save to cache
    await setCachedData(key, data, ttl);

    return data;
}

module.exports = {
    getCachedData,
    setCachedData,
    invalidateCache,
    withCache
};
