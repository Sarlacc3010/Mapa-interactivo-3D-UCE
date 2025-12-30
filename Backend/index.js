const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // IMPORTANTE: Carga las variables del .env

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONFIGURACIÓN DE LA BASE DE DATOS (Usando el .env)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const SECRET_KEY = process.env.JWT_SECRET;

// --- RUTA DE PRUEBA (Para ver si el backend vive) ---
app.get('/', (req, res) => {
  res.send('Backend UCE funcionando correctamente 🚀');
});

// --- RUTA DE REGISTRO ---
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar si existe
    const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExist.rows.length > 0) return res.status(400).json({ error: "Correo ya registrado" });

    // Encriptar
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Guardar
    const newUser = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *",
      [email, hashedPassword, 'user']
    );

    const token = jwt.sign({ id: newUser.rows[0].id, role: 'user' }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ message: "Usuario creado", token, role: 'user', email: newUser.rows[0].email });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: "Error en el servidor al registrar" }); 
  }
});

// --- RUTA DE LOGIN ---
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (userResult.rows.length === 0) return res.status(400).json({ error: "Usuario no encontrado" });

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ message: "Login exitoso", token, role: user.role, email: user.email });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: "Error en el servidor al iniciar sesión" }); 
  }
});

// --- RUTA DE VISITAS (GEOFENCING) ---
app.post('/visits', async (req, res) => {
  try {
    const { location_id, user_email } = req.body;
    await pool.query(
      "INSERT INTO visits (location_id, visitor_email) VALUES ($1, $2)",
      [location_id, user_email || 'anonimo']
    );
    console.log(`📍 Visita registrada: ${location_id} - Usuario: ${user_email}`);
    res.json({ message: "Visita registrada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar visita" });
  }
});

// --- ARRANCAR SERVIDOR ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend listo en http://localhost:${PORT}`);
  console.log(`📡 Conectado a DB: ${process.env.DB_NAME} como ${process.env.DB_USER}`);
});