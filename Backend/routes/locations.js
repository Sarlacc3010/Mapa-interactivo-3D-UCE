const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Usamos las mismas credenciales que en tu index.js
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// GET /api/locations
router.get('/', async (req, res) => {
  try {
    // Consulta SQL en lugar de Mongoose
    const result = await pool.query('SELECT * FROM locations ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener ubicaciones" });
  }
});

module.exports = router;