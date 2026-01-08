const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

// --- NUEVOS IMPORTS (MONGO, REDIS, ARCHIVOS) ---
const mongoose = require('mongoose');
const { createClient } = require('redis');
const path = require('path');
const fs = require('fs');

// IMPORTAR RUTAS Y MIDDLEWARE PROPIOS
const locationRoutes = require('./routes/locations');
const verifyToken = require('./authMiddleware');
const { sendEventNotification } = require('./emailService');

const app = express();
const PORT = 5000;

// ==========================================
// 1. MIDDLEWARES GLOBALES
// ==========================================
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// ==========================================
// 2. CONFIGURACIÓN DE IMÁGENES (NUEVO)
// ==========================================
// Creamos la ruta absoluta a la carpeta pública
const uploadDir = path.join(__dirname, 'public', 'uploads');

// Si la carpeta no existe, la creamos automáticamente
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📂 Carpeta /public/uploads creada');
}

// Servimos la carpeta como estática. 
// Acceso web: http://localhost:5000/uploads/nombre_imagen.jpg
app.use('/uploads', express.static(uploadDir));


// ==========================================
// 3. CONEXIÓN BASE DE DATOS SQL (PostgreSQL)
// ==========================================
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST, // En Docker esto será 'postgres_db'
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
const SECRET_KEY = process.env.JWT_SECRET;


// ==========================================
// 4. CONEXIÓN BASE DE DATOS NOSQL (MongoDB) - (NUEVO)
// ==========================================
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/uce_nosql_db';

mongoose.connect(mongoUri)
  .then(() => console.log('✅ Conectado a MongoDB Exitosamente'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));


// ==========================================
// 5. CONEXIÓN CACHÉ (Redis) - (NUEVO)
// ==========================================
const redisClient = createClient({
  // En Docker, REDIS_HOST será 'redis_cache'
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.log('❌ Error en Redis Client', err));

// Iniciamos la conexión asíncrona a Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Conectado a Redis Exitosamente');
  } catch (error) {
    console.log('⚠️ No se pudo conectar a Redis (Verificar contenedor)');
  }
})();


// ==========================================
// 6. ESTRATEGIA PASSPORT (GOOGLE OAUTH)
// ==========================================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // A. Buscar si existe por Google ID
      const res = await pool.query("SELECT * FROM users WHERE google_id = $1", [profile.id]);
      
      if (res.rows.length > 0) {
        return done(null, res.rows[0]);
      } 
      
      // B. Buscar por email para vincular cuentas
      const email = profile.emails[0].value;
      const emailRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      
      if (emailRes.rows.length > 0) {
        const user = emailRes.rows[0];
        await pool.query(
          "UPDATE users SET google_id = $1, avatar = $2 WHERE email = $3", 
          [profile.id, profile.photos[0]?.value, email]
        );
        return done(null, user);
      } 
      
      // C. Crear usuario nuevo
      const newUser = await pool.query(
        "INSERT INTO users (email, google_id, role, avatar) VALUES ($1, $2, $3, $4) RETURNING *",
        [email, profile.id, 'user', profile.photos[0]?.value]
      );
      return done(null, newUser.rows[0]);

    } catch (err) {
      console.error("Error en estrategia Google:", err);
      return done(err, null);
    }
  }
));


// ==========================================
// 7. RUTAS (ENDPOINTS)
// ==========================================

// --- A. Rutas Google OAuth ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login?error=auth_failed' }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      SECRET_KEY, 
      { expiresIn: '24h' }
    );
    res.redirect(`http://localhost:5173/login?token=${token}&role=${user.role}&email=${user.email}`);
  }
);

// --- B. Ruta de Ubicaciones ---
app.use('/api/locations', locationRoutes); 

// --- C. Rutas de Prueba Generales ---
app.get('/', (req, res) => {
  res.send('Backend UCE (SQL + Mongo + Redis + Img) funcionando 🚀');
});

// Prueba Rápida de Redis
app.get('/test-redis', async (req, res) => {
    try {
        await redisClient.set('prueba_uce', 'Funciona el Caché');
        const valor = await redisClient.get('prueba_uce');
        res.json({ mensaje: 'Redis responde correctamente', valor });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- D. Registro de Usuario (Email/Pass) ---
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExist.rows.length > 0) return res.status(400).json({ error: "Correo ya registrado" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *",
      [email, hashedPassword, 'user']
    );

    const token = jwt.sign({ id: newUser.rows[0].id, email: newUser.rows[0].email, role: 'user' }, SECRET_KEY, { expiresIn: '24h' });
    
    res.json({ message: "Usuario creado", token, role: 'user', email: newUser.rows[0].email });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: "Error en el servidor al registrar" }); 
  }
});

// --- E. Login (Email/Pass) ---
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (userResult.rows.length === 0) return res.status(400).json({ error: "Usuario no encontrado" });

    const user = userResult.rows[0];

    if (!user.password) {
      return res.status(400).json({ error: "Usa el botón de Google para ingresar con este correo" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ message: "Login exitoso", token, role: user.role, email: user.email });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: "Error en el servidor al iniciar sesión" }); 
  }
});

// --- F. Registrar Visita ---
app.post('/visits', verifyToken, async (req, res) => {
  try {
    const { location_id } = req.body;
    const userEmail = req.user.email;

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

// --- G. Eventos (SQL) ---
app.get('/api/events', async (req, res) => {
  try {
    const query = `
      SELECT e.id, e.title, e.description, e.date, l.name as location_name, e.location_id
      FROM events e
      LEFT JOIN locations l ON e.location_id = l.id
      ORDER BY e.date DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error buscando eventos:", err);
    res.status(500).json({ error: "Error al cargar eventos" });
  }
});

app.post('/api/events', verifyToken, async (req, res) => {
  try {
    const { title, description, date, location_id } = req.body;

    const newEvent = await pool.query(
      "INSERT INTO events (title, description, date, location_id) VALUES($1, $2, $3, $4) RETURNING *",
      [title, description, date, location_id]
    );

    console.log("✅ Evento guardado en SQL ID:", newEvent.rows[0].id);

    // Notificación por correo
    const usersResult = await pool.query("SELECT email FROM users");
    const emailList = usersResult.rows.map(user => user.email);

    if (emailList.length > 0) {
        sendEventNotification(emailList, title, date, description).catch(console.error); 
    }

    res.json(newEvent.rows[0]);
  } catch (err) { 
    console.error("Error al crear evento:", err);
    res.status(500).json({ error: err.message }); 
  }
});

// ==========================================
// 8. INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend listo en http://localhost:${PORT}`);
  console.log(`📡 DB SQL: ${process.env.DB_HOST}`);
});