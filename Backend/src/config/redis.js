const redis = require('redis');

// Variables de entorno o valores por defecto
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redisUrl = `redis://${REDIS_HOST}:${REDIS_PORT}`;

console.log(`🔌 [REDIS CONFIG] Intentando conectar a: ${redisUrl}`);

const client = redis.createClient({
  url: redisUrl
});

client.on('error', (err) => console.error('❌ [REDIS ERROR]:', err));
client.on('connect', () => console.log('✅ [REDIS] Conectado exitosamente'));

// Iniciamos conexión una sola vez aquí
(async () => {
  if (!client.isOpen) {
    try {
      await client.connect();
    } catch (err) {
      console.error('❌ Error fatal conectando a Redis:', err);
    }
  }
})();

module.exports = client;