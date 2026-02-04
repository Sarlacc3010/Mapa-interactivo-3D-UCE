const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const redisClient = require('../config/redis'); // Importamos Redis
const upload = require('../middlewares/upload'); // Middleware para subir imágenes
const authMiddleware = require('../middlewares/authMiddleware'); // Protección de rutas

// =================================================================
// 1. OBTENER TODOS LOS EVENTOS (PÚBLICO - CON CACHÉ REDIS)
// =================================================================
router.get('/', async (req, res) => {
  try {
    // A. Intentar obtener de Redis primero
    try {
      const cachedEvents = await redisClient.get('all_events');
      if (cachedEvents) {
        // console.log("⚡ Sirviendo eventos desde Redis");
        return res.json(JSON.parse(cachedEvents));
      }
    } catch (redisError) {
      console.error("Redis Error (ignorando caché):", redisError.message);
    }

    // B. Si no hay caché, consultar PostgreSQL
    // NOTA: Quitamos "WHERE date >= CURRENT_DATE" para que el Admin vea el historial.
    // Ordenamos por fecha descendente (lo más nuevo/futuro arriba).
    const result = await pool.query("SELECT * FROM events ORDER BY date DESC");

    // C. Guardar en Redis por 1 hora (3600 segundos)
    try {
      await redisClient.setEx('all_events', 3600, JSON.stringify(result.rows));
    } catch (redisError) {
      console.error("No se pudo guardar en Redis:", redisError.message);
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// =================================================================
// 2. OBTENER EVENTOS POR UBICACIÓN (PÚBLICO)
// =================================================================
router.get('/location/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Traemos TODOS los eventos de esa ubicación (Historial completo)
    // El Frontend se encarga de filtrar si es estudiante.
    const result = await pool.query(
      "SELECT * FROM events WHERE location_id = $1 ORDER BY date ASC, time ASC", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.json([]); // Retorna array vacío si no hay eventos
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// =================================================================
// 3. OBTENER UN EVENTO POR ID (PÚBLICO)
// =================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Evento no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// =================================================================
// 4. CREAR EVENTO (PROTEGIDO - ADMIN)
// =================================================================
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, time, location_id } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Validación básica
    if (!title || !date || !location_id) {
        return res.status(400).json({ msg: "Faltan campos obligatorios" });
    }

    const newEvent = await pool.query(
      "INSERT INTO events (title, description, date, time, location_id, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description, date, time, location_id, image_url]
    );

    // 🔥 IMPORTANTE: Borrar caché para que aparezca el nuevo evento
    await redisClient.del('all_events');

    res.json(newEvent.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// =================================================================
// 5. ACTUALIZAR EVENTO (PROTEGIDO - ADMIN)
// =================================================================
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, location_id } = req.body;
    
    // Si suben nueva imagen, usamos esa. Si no, mantenemos la anterior (logic compleja omitida por brevedad, asume reemplazo o null)
    // Para hacerlo robusto, primero buscamos el evento viejo:
    const oldEvent = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (oldEvent.rows.length === 0) return res.status(404).json({ msg: "Evento no encontrado" });

    const image_url = req.file ? `/uploads/${req.file.filename}` : oldEvent.rows[0].image_url;

    await pool.query(
      "UPDATE events SET title = $1, description = $2, date = $3, time = $4, location_id = $5, image_url = $6 WHERE id = $7",
      [title, description, date, time, location_id, image_url, id]
    );

    // 🔥 IMPORTANTE: Borrar caché
    await redisClient.del('all_events');

    res.json({ msg: "Evento actualizado" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// =================================================================
// 6. ELIMINAR EVENTO (PROTEGIDO - ADMIN)
// =================================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Primero borramos las suscripciones asociadas para mantener integridad (si no tienes ON DELETE CASCADE)
    // await pool.query("DELETE FROM event_subscriptions WHERE event_id = $1", [id]);

    const deleteEvent = await pool.query("DELETE FROM events WHERE id = $1 RETURNING *", [id]);

    if (deleteEvent.rows.length === 0) {
      return res.status(404).json({ msg: "Evento no encontrado" });
    }

    // 🔥 IMPORTANTE: Borrar caché
    await redisClient.del('all_events');

    res.json({ msg: "Evento eliminado" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;