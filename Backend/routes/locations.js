const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { createClient } = require('redis');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.log('⚠️ Redis Error:', err));
(async () => { try { await redisClient.connect(); } catch (e) {} })();

// ==========================================
// RUTA GET: OBTENER EDIFICIOS + CONTEO DE VISITAS
// ==========================================
router.get('/', async (req, res) => {
  const CACHE_KEY = 'locations_with_visits_v1'; 

  try {
    // A. INTENTO LEER DE REDIS
    try {
        const cachedData = await redisClient.get(CACHE_KEY);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }
    } catch (e) { }

    // B. CONSULTA SQL (CONTEO DE VISITAS REAL)
    // Hacemos un LEFT JOIN con la tabla 'visits' y contamos
    console.log("🐢 [SQL] Calculando visitas...");
    const query = `
        SELECT l.*, COUNT(v.id)::int as visit_count 
        FROM locations l 
        LEFT JOIN visits v ON l.id = v.location_id 
        GROUP BY l.id 
        ORDER BY l.name ASC
    `;
    const result = await pool.query(query);
    
    // C. PROCESAMIENTO DE DATOS
    const locations = result.rows.map(loc => {
        let cat = loc.category || 'Otro'; 
        const catLower = cat.toLowerCase().trim();

        if (catLower.includes('facultad') || catLower.includes('academico')) cat = 'Facultades';
        else if (catLower.includes('admin') || catLower.includes('rectorado')) cat = 'Administrativo';
        else if (catLower.includes('biblioteca')) cat = 'Biblioteca';
        else if (catLower.includes('teatro')) cat = 'Teatro';
        else cat = cat.charAt(0).toUpperCase() + cat.slice(1);

        return {
            ...loc, 
            category: cat,  
            schedule: loc.schedule || "07:00 - 18:00", 
            visit_count: parseInt(loc.visit_count || 0), // Aseguramos que sea número
            position: [parseFloat(loc.x || 0), parseFloat(loc.y || 0), parseFloat(loc.z || 0)]
        };
    });

    // D. GUARDAR EN REDIS (Expiración corta: 5 minutos, para que los contadores se actualicen)
    try {
        await redisClient.set(CACHE_KEY, JSON.stringify(locations), { EX: 300 });
    } catch (e) {}

    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

// ==========================================
// RUTA POST: REGISTRAR UNA VISITA (CLICK)
// ==========================================
router.post('/:id/visit', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query("INSERT INTO visits (location_id, visitor_email) VALUES ($1, 'anonymous')", [id]);
        
        // 1. Borramos caché
        await redisClient.del('locations_with_visits_v1');

        // 2. 🔥 ESTO ES LO QUE FALTABA: ¡AVISAR AL SOCKET!
        if (req.io) {
            req.io.emit('server:data_updated', { 
                type: 'VISIT_REGISTERED', 
                location_id: id 
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Error registrando visita:", err);
        res.status(500).json({ error: "Error registrando visita" });
    }
});

// ==========================================
// RUTA POST: CREAR EDIFICIO
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { name, category, object3d_id, position, description, image_url, schedule } = req.body;
        const x = position ? position[0] : 0;
        const y = position ? position[1] : 0;
        const z = position ? position[2] : 0;

        const newLoc = await pool.query(
            `INSERT INTO locations (name, category, object3d_id, description, image_url, schedule, x, y, z) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [name, category, object3d_id, description, image_url, schedule, x, y, z]
        );

        await redisClient.del('locations_with_visits_v1');
        
        if (req.io) req.io.emit('server:data_updated', { type: 'LOCATION_ADDED', data: newLoc.rows[0] });

        res.json(newLoc.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;