const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 1. IMPORTAR MIDDLEWARE Y SERVICIO DE CORREO
const verifyToken = require('./authMiddleware');
const { sendEventNotification } = require('./emailService');

const app = express();
app.use(cors());
app.use(express.json());

// 2. CONFIGURACIÓN BASE DE DATOS
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const SECRET_KEY = process.env.JWT_SECRET;

// --- RUTA DE PRUEBA ---
app.get('/', (req, res) => {
  res.send('Backend UCE funcionando correctamente 🚀');
});

// --- RUTA DE REGISTRO (Pública) ---
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar si existe
    const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExist.rows.length > 0) return res.status(400).json({ error: "Correo ya registrado" });

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Guardar usuario
    const newUser = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *",
      [email, hashedPassword, 'user']
    );

    // Generar token
    const token = jwt.sign({ id: newUser.rows[0].id, email: newUser.rows[0].email, role: 'user' }, SECRET_KEY, { expiresIn: '24h' });
    
    res.json({ message: "Usuario creado", token, role: 'user', email: newUser.rows[0].email });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: "Error en el servidor al registrar" }); 
  }
});

// --- RUTA DE LOGIN (Pública) ---
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (userResult.rows.length === 0) return res.status(400).json({ error: "Usuario no encontrado" });

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ message: "Login exitoso", token, role: user.role, email: user.email });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: "Error en el servidor al iniciar sesión" }); 
  }
});

// --- RUTA DE VISITAS (PROTEGIDA 🔒) ---
app.post('/visits', verifyToken, async (req, res) => {
  try {
    const { location_id } = req.body;
    const userEmail = req.user.email; // Obtenemos el email del token

    await pool.query(
      "INSERT INTO visits (location_id, visitor_email) VALUES ($1, $2)",
      [location_id, userEmail]
    );
    console.log(`📍 Visita registrada: ${location_id} - Usuario: ${userEmail}`);
    res.json({ message: "Visita registrada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar visita" });
  }
});

// --- RUTA DE EVENTOS (PROTEGIDA + NOTIFICACIONES) ---
app.post('/events', verifyToken, async (req, res) => {
  try {
    // 1. Asegúrate de recibir 'description' aquí
    const { title, description, location, date, time } = req.body;
    const userId = req.user.id;

    // Guardar evento
    const newEvent = await pool.query(
      "INSERT INTO events (title, description, location, date, time, created_by) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description, location, date, time, userId]
    );

    // Enviar Correos
    console.log("🔍 Buscando usuarios para notificar...");
    const usersResult = await pool.query("SELECT email FROM users");
    const emailList = usersResult.rows.map(user => user.email);

    if (emailList.length > 0) {
        console.log("🚀 Intentando enviar correos...");
        // 2. AQUI PASAMOS LA DESCRIPCIÓN (Agregamos el 4to parámetro)
        sendEventNotification(emailList, title, date, description); 
    }

    res.json(newEvent.rows[0]);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: err.message }); 
  }
});

// --- INICIAR SERVIDOR ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend listo en http://localhost:${PORT}`);
  console.log(`📡 Conectado a DB: ${process.env.DB_NAME} como ${process.env.DB_USER}`);
});