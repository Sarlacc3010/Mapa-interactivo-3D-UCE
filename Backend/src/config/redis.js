const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.log('❌ Error Redis', err));

(async () => {
    try { await redisClient.connect(); console.log('✅ Conectado a Redis'); }
    catch (e) { console.log('⚠️ Sin conexión a Redis'); }
})();

module.exports = redisClient;