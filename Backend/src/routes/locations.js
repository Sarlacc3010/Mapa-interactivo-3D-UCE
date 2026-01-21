// Backend/src/routes/locations.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 
const verifyToken = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken'); // Necesario para verificar token manualmente

// ==========================================
// 1. OBTENER UBICACIONES (PÚBLICO)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM locations ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// ==========================================
// 2. REGISTRAR VISITA (PÚBLICO / MIXTO)
// ==========================================
// 🔥 QUITAMOS 'verifyToken' del middleware principal para no bloquear anónimos
router.post('/:id/visit', async (req, res) => {
  try {
    const { id } = req.params; 
    
    // Valor por defecto para anónimos
    let userEmail = 'anonimo@visitante.com'; 

    // Intentamos leer el token manualmente sin bloquear la petición
    const token = req.cookies.access_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userEmail = decoded.email; // Si el token es válido, usamos el email real
        } catch (e) {
            // Si el token es inválido o expiró, simplemente seguimos como anónimo
            console.log("Token inválido en visita, registrando como anónimo.");
        }
    }

    // A. Guardar en Base de Datos
    await pool.query(
      "INSERT INTO visits (location_id, visitor_email) VALUES ($1, $2)", 
      [id, userEmail]
    );

    // B. Notificar al Dashboard en Tiempo Real
    if (req.io) {
        req.io.emit('server:visit_registered', { 
            location_id: id, 
            timestamp: new Date() 
        });
    }

    res.json({ message: "Visita registrada con éxito" });
  } catch (err) {
    console.error("Error registrando visita:", err.message);
    res.status(500).json({ error: "Error al registrar visita" });
  }
});

// ==========================================
// 3. CREAR UBICACIÓN (SOLO ADMIN)
// ==========================================
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, category, coordinates, object3d_id, faculty_id } = req.body;
    
    const newLocation = await pool.query(
      "INSERT INTO locations (name, description, category, coordinates, object3d_id, faculty_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, description, category, JSON.stringify(coordinates), object3d_id, faculty_id]
    );

    res.json(newLocation.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// ==========================================
// 4. EDITAR UBICACIÓN
// ==========================================
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, coordinates, object3d_id } = req.body;

    const updateLocation = await pool.query(
      "UPDATE locations SET name = $1, description = $2, category = $3, coordinates = $4, object3d_id = $5 WHERE id = $6 RETURNING *",
      [name, description, category, JSON.stringify(coordinates), object3d_id, id]
    );

    res.json(updateLocation.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// ==========================================
// 5. ELIMINAR UBICACIÓN
// ==========================================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM locations WHERE id = $1", [id]);
    res.json("Ubicación eliminada");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

module.exports = router;