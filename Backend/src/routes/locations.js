const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken'); 
const redisClient = require('../config/redis'); 

const CACHE_KEY = 'locations:all'; 

// ==========================================
// 1. OBTENER UBICACIONES (CON LOGS DE DEPURACIÓN)
// ==========================================
router.get('/', async (req, res) => {
  try {
    let data = null;
    let isCached = false;

    // A. Intentar leer de Redis
    try {
        if (redisClient.isReady) { // Solo intentamos si Redis está listo
            const cachedData = await redisClient.get(CACHE_KEY);
            if (cachedData) {
                console.log('🚀 [CACHE HIT] Datos servidos desde Redis');
                data = JSON.parse(cachedData);
                isCached = true;
            }
        } else {
            console.warn('⚠️ [CACHE SKIP] Redis no está listo todavía.');
        }
    } catch (redisErr) {
        console.error('❌ Error leyendo Redis:', redisErr.message);
    }

    // Si encontramos caché, respondemos y terminamos aquí
    if (isCached && data) {
        return res.json(data);
    }

    // B. Si no hay caché, leer de Base de Datos
    console.log('🐢 [DB READ] Consultando PostgreSQL...');
    const result = await pool.query("SELECT * FROM locations ORDER BY id ASC");
    data = result.rows;

    // C. Guardar en Redis (Si está disponible)
    try {
        if (redisClient.isReady) {
            // Guardamos por 1 hora (3600 segundos)
            await redisClient.setEx(CACHE_KEY, 3600, JSON.stringify(data));
            console.log('💾 [CACHE SAVE] Datos guardados en Redis correctamente.');
        }
    } catch (saveErr) {
        console.error('❌ Error guardando en Redis:', saveErr.message);
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Error CRÍTICO en GET /locations:", err.message);
    res.status(500).send("Error del servidor");
  }
});

// ==========================================
// 2. REGISTRAR VISITA (PÚBLICO / MIXTO)
// ==========================================
router.post('/:id/visit', async (req, res) => {
  try {
    const { id } = req.params; 
    let userEmail = 'anonimo@visitante.com'; 

    // Intentamos extraer el usuario del token (si existe)
    const token = req.cookies.access_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userEmail = decoded.email;
        } catch (e) { 
            // Si el token expiró o es inválido, contamos como anónimo y no rompemos el flujo
            console.log("Token inválido en visita, registrando como anónimo.");
        }
    }

    // Registrar en BD
    await pool.query("INSERT INTO visits (location_id, visitor_email) VALUES ($1, $2)", [id, userEmail]);

    // Emitir evento Socket.io (Tiempo Real)
    if (req.io) {
        req.io.emit('server:visit_registered', { location_id: id, timestamp: new Date() });
    }

    res.json({ message: "Visita registrada correctamente" });
  } catch (err) {
    console.error("Error registrando visita:", err.message);
    res.status(500).json({ error: "Error interno al registrar visita" });
  }
});

// ==========================================
// 3. RUTAS ADMIN (INVALIDAN CACHÉ 🗑️)
// ==========================================

// CREAR UBICACIÓN
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, category, coordinates, object3d_id, faculty_id } = req.body;
    
    const newLocation = await pool.query(
      "INSERT INTO locations (name, description, category, coordinates, object3d_id, faculty_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, description, category, JSON.stringify(coordinates), object3d_id, faculty_id]
    );

    // 🔥 Invalidar Caché: Obligamos a recargar datos frescos la próxima vez
    if (redisClient.isOpen) await redisClient.del(CACHE_KEY);

    res.json(newLocation.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// EDITAR UBICACIÓN
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, coordinates, object3d_id } = req.body;

    const updateLocation = await pool.query(
      "UPDATE locations SET name = $1, description = $2, category = $3, coordinates = $4, object3d_id = $5 WHERE id = $6 RETURNING *",
      [name, description, category, JSON.stringify(coordinates), object3d_id, id]
    );

    // 🔥 Invalidar Caché
    if (redisClient.isOpen) await redisClient.del(CACHE_KEY);

    res.json(updateLocation.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// ELIMINAR UBICACIÓN
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM locations WHERE id = $1", [id]);
    
    // 🔥 Invalidar Caché
    if (redisClient.isOpen) await redisClient.del(CACHE_KEY);

    res.json("Ubicación eliminada");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

module.exports = router;