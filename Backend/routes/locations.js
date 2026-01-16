const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { createClient } = require('redis');
require('dotenv').config();

// 1. Configuración de Base de Datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 2. Configuración de Redis
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.log('⚠️ Redis Error:', err));

// Conexión inicial segura a Redis
(async () => { 
    try { await redisClient.connect(); } catch (e) {} 
})();

// ==========================================
// RUTA GET: OBTENER EDIFICIOS
// ==========================================
router.get('/', async (req, res) => {
  // Cambiamos la key para forzar una caché nueva basada en 'category'
  const CACHE_KEY = 'locations_category_v1'; 

  try {
    // A. INTENTO LEER DE REDIS
    try {
        const cachedData = await redisClient.get(CACHE_KEY);
        if (cachedData) {
            console.log("⚡ [REDIS] Locations desde caché");
            return res.json(JSON.parse(cachedData));
        }
    } catch (e) { /* Si falla Redis, seguimos... */ }

    // B. CONSULTA SQL (Usando columna 'category')
    console.log("🐢 [SQL] Consultando base de datos...");
    const result = await pool.query('SELECT * FROM locations ORDER BY name ASC');
    
    // C. PROCESAMIENTO DE DATOS
    const locations = result.rows.map(loc => {
        // Obtenemos la categoría directo de la BD
        let cat = loc.category || 'Otro'; 
        const catLower = cat.toLowerCase().trim();

        // --- NORMALIZACIÓN PARA EL FILTRO DEL FRONTEND ---
        // Tu SearchPanel espera: "Facultades", "Administrativo", "Biblioteca", "Teatro"
        if (catLower.includes('facultad') || catLower.includes('academico')) {
            cat = 'Facultades';
        } else if (catLower.includes('admin') || catLower.includes('rectorado')) {
            cat = 'Administrativo';
        } else if (catLower.includes('biblioteca')) {
            cat = 'Biblioteca';
        } else if (catLower.includes('teatro')) {
            cat = 'Teatro';
        } else {
             // Capitalizar primera letra para que se vea bien (ej: "cafeteria" -> "Cafeteria")
             cat = cat.charAt(0).toUpperCase() + cat.slice(1);
        }

        return {
            ...loc, // Copia todo (id, name, description, etc.)
            
            // Sobrescribimos con el valor normalizado para que funcionen los filtros
            category: cat,  
            
            // Aseguramos schedule
            schedule: loc.schedule || "07:00 - 18:00", 
            
            // Agrupamos coordenadas para el 3D
            position: [
                parseFloat(loc.x || 0), 
                parseFloat(loc.y || 0), 
                parseFloat(loc.z || 0)
            ]
        };
    });

    // D. GUARDAR EN REDIS
    try {
        await redisClient.set(CACHE_KEY, JSON.stringify(locations), { EX: 86400 });
    } catch (e) {}

    // E. RESPONDER
    res.json(locations);

  } catch (err) {
    console.error("Error locations:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ==========================================
// RUTA POST: CREAR (Usando 'category')
// ==========================================
router.post('/', async (req, res) => {
    try {
        // Recibimos 'category' del frontend
        const { name, category, object3d_id, position, description, image_url, schedule } = req.body;
        
        const x = position ? position[0] : 0;
        const y = position ? position[1] : 0;
        const z = position ? position[2] : 0;

        // Insertamos en la columna 'category'
        const query = `
            INSERT INTO locations (name, category, object3d_id, description, image_url, schedule, x, y, z) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *
        `;
        
        const newLocation = await pool.query(query, [
            name, category, object3d_id, description, image_url, schedule, x, y, z
        ]);

        // Borrar caché
        await redisClient.del('locations_category_v1');
        
        res.json(newLocation.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;