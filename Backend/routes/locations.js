const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST, // En Docker esto será 'db'
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Obtener todas las ubicaciones
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener locations:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;