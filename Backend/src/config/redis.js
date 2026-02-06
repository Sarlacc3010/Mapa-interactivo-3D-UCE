const redis = require('redis');
require('dotenv').config();

// Adjust this according to your docker-compose. If your service is named 'redis_cache', use that host.
const url = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`;

console.log(`[REDIS CONFIG] Configured for: ${url}`);

const client = redis.createClient({
    url: url,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 20) return new Error('Redis connection retries exhausted');
            return Math.min(retries * 100, 3000);
        }
    }
});

client.on('error', (err) => console.error('[REDIS ERROR]:', err.message));
client.on('connect', () => console.log('[REDIS] Client connected'));

const connectRedis = async () => {
    if (!client.isOpen) {
        await client.connect();
    }
    return client;
};

module.exports = { client, connectRedis };