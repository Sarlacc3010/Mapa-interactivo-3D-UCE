const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');
require('dotenv').config();

// --- NUEVOS IMPORTS ---
const mongoose = require('mongoose');
const { createClient } = require('redis');
const path = require('path');
const fs = require('fs');

// IMPORTAR RUTAS Y MIDDLEWARE
const locationRoutes = require('./routes/locations');
const verifyToken = require('./authMiddleware');
const { sendEventNotification } = require('./emailService');

const app = express();
const PORT = 5000;

// ==========================================
// 1. MIDDLEWARES GLOBALES
// ==========================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Tu frontend
  credentials: true // ¡CRÍTICO! Permite recibir cookies del frontend
}));

app.use(express.json());
app.use(cookieParser()); // Permite leer las cookies que llegan
app.use(passport.initialize());

// Configuración de Cookies (Centralizada para reusar)
const COOKIE_OPTIONS = {
  httpOnly: true, // La magia: JavaScript del frontend NO puede leer esto
  secure: process.env.NODE_ENV === 'production', // En producción (HTTPS) debe ser true
  sameSite: 'lax', // Permite navegación normal y Google OAuth
  maxAge: 24 * 60 * 60 * 1000 // 24 horas
};

// ==========================================
// 2. CONFIGURACIÓN DE IMÁGENES
// ==========================================
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ==========================================
// 3. CONEXIÓN BASE DE DATOS SQL
// ==========================================
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
const SECRET_KEY = process.env.JWT_SECRET;

// ==========================================
// 4. CONEXIÓN MONGODB
// ==========================================
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/uce_nosql_db';
mongoose.connect(mongoUri)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// ==========================================
// 5. CONEXIÓN REDIS
// ==========================================
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});
redisClient.on('error', (err) => console.log('❌ Error Redis', err));
(async () => {
  try { await redisClient.connect(); console.log('✅ Conectado a Redis'); } 
  catch (e) { console.log('⚠️ Sin conexión a Redis'); }
})();

// ==========================================
// 6. GOOGLE OAUTH
// ==========================================
// Solo configuramos si existen las credenciales para evitar errores al arrancar
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const res = await pool.query("SELECT * FROM users WHERE google_id = $1", [profile.id]);
        if (res.rows.length > 0) return done(null, res.rows[0]);
        
        const email = profile.emails[0].value;
        const emailRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (emailRes.rows.length > 0) {
          const user = emailRes.rows[0];
          await pool.query("UPDATE users SET google_id = $1, avatar = $2 WHERE email = $3", [profile.id, profile.photos[0]?.value, email]);
          return done(null, user);
        } 
        
        const newUser = await pool.query(
          "INSERT INTO users (email, google_id, role, avatar) VALUES ($1, $2, $3, $4) RETURNING *",
          [email, profile.id, 'user', profile.photos[0]?.value]
        );
        return done(null, newUser.rows[0]);
      } catch (err) { return done(err, null); }
    }
  ));
}

// ==========================================
// 7. RUTAS (ENDPOINTS)
// ==========================================

// --- A. Google Routes (MODIFICADO PARA COOKIES) ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login?error=auth_failed' }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    
    // 1. Establecer cookie segura
    res.cookie('access_token', token, COOKIE_OPTIONS);
    
    // 2. Redirigir al frontend SIN el token en la URL (Más seguro)
    res.redirect(`http://localhost:5173/?loginSuccess=true&role=${user.role}`);
  }
);

// --- B. Login Manual (MODIFICADO) ---
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (userResult.rows.length === 0) return res.status(400).json({ error: "Usuario no encontrado" });

    const user = userResult.rows[0];
    if (!user.password) return res.status(400).json({ error: "Usa Google para ingresar" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    
    // [SEGURIDAD] Enviar Cookie HttpOnly
    res.cookie('access_token', token, COOKIE_OPTIONS);
    
    // En el JSON solo confirmación, NO el token
    res.json({ 
        message: "Login exitoso", 
        user: { email: user.email, role: user.role } 
    });
  } catch (err) { res.status(500).json({ error: "Error de servidor" }); }
});

// --- C. Logout (NUEVO) ---
app.post('/api/logout', (req, res) => {
    res.clearCookie('access_token'); // Borra la cookie del navegador
    res.json({ message: "Sesión cerrada" });
});

// --- D. Perfil / Verificar Sesión (NUEVO - Para React) ---
// El frontend llamará a esto al recargar la página para saber si sigue logueado
app.get('/api/profile', verifyToken, (req, res) => {
    // verifyToken ya decodificó la cookie y puso el usuario en req.user
    res.json({ user: req.user });
});

// --- REGISTRO DE USUARIO (CORREGIDO) ---
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Verificar si ya existe
    const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExist.rows.length > 0) return res.status(400).json({ error: "Este correo ya está registrado" });

    // 2. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Crear usuario en BD
    const newUser = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *",
      [email, hashedPassword, 'user']
    );

    // 4. Generar Token y Cookie (Para auto-login)
    const token = jwt.sign(
        { id: newUser.rows[0].id, email: newUser.rows[0].email, role: 'user' }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
    );
    
    // Configuración de cookie segura
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });
    
    // 5. Responder
    res.json({ 
        message: "Usuario creado exitosamente", 
        user: { role: 'user', email: newUser.rows[0].email }
    });

  } catch (err) { 
    console.error("Error en registro:", err);
    res.status(500).json({ error: "Error al registrar usuario" }); 
  }
});

// --- Rutas Protegidas ---
app.use('/api/locations', locationRoutes); 

// 1. CORREGIDO EL GET (Para que TRAIGA la hora)
app.get('/api/events', async (req, res) => {
  try {
    // Agregamos e.time a la consulta
    const query = `
      SELECT e.id, e.title, e.description, e.date, e.time, l.name as location_name, e.location_id 
      FROM events e 
      LEFT JOIN locations l ON e.location_id = l.id 
      ORDER BY e.date DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Error cargando eventos" }); }
});

// 2. CORREGIDO EL POST (Para que GUARDE la hora)
app.post('/api/events', verifyToken, async (req, res) => {
  try {
    // Leemos 'time' del cuerpo de la petición
    const { title, description, date, time, location_id } = req.body;
    
    // Lo agregamos al INSERT ($4 es la hora, $5 es location_id)
    const newEvent = await pool.query(
      "INSERT INTO events (title, description, date, time, location_id) VALUES($1, $2, $3, $4, $5) RETURNING *", 
      [title, description, date, time, location_id]
    );
    
    // Notificación (opcional)
    const usersResult = await pool.query("SELECT email FROM users");
    const emailList = usersResult.rows.map(u => u.email);
    if (emailList.length > 0) sendEventNotification(emailList, title, date, description).catch(console.error); 
    
    res.json(newEvent.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/visits', verifyToken, async (req, res) => {
  try {
    const { location_id } = req.body;
    const userEmail = req.user.email;
    await pool.query("INSERT INTO visits (location_id, visitor_email) VALUES ($1, $2)", [location_id, userEmail]);
    res.json({ message: "Visita registrada" });
  } catch (err) { res.status(500).json({ error: "Error al registrar visita" }); }
});

// --- G. Eventos (SQL) ---

app.get('/api/events', async (req, res) => {
  try {
    const query = `
      SELECT e.id, e.title, e.description, e.date, e.time, l.name as location_name, e.location_id
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

// --- VALIDACIÓN DE FECHA (Helper) ---
const isPastDate = (dateStr, timeStr) => {
    // Combina fecha y hora para crear un objeto Date completo
    // dateStr suele ser YYYY-MM-DD y timeStr HH:mm
    const eventDate = new Date(`${dateStr}T${timeStr || '00:00:00'}`);
    const now = new Date();
    // Restamos 5 horas si el servidor no está en la zona horaria de Ecuador, 
    // pero si ambos (cliente y server) usan hora local, esto basta:
    return eventDate < now;
};

// --- CREAR EVENTO (POST) CON VALIDACIÓN ---
app.post('/api/events', verifyToken, async (req, res) => {
  try {
    const { title, description, date, time, location_id } = req.body;

    // 1. VALIDACIÓN: NO PERMITIR FECHAS PASADAS
    if (isPastDate(date, time)) {
        return res.status(400).json({ error: "No puedes crear eventos en una fecha u hora pasada." });
    }

    const newEvent = await pool.query(
      "INSERT INTO events (title, description, date, time, location_id) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [title, description, date, time, location_id]
    );

    console.log("✅ Evento guardado ID:", newEvent.rows[0].id);

    // ... lógica de envío de correo (sin cambios) ...
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

// --- EDITAR EVENTO (PUT) CON VALIDACIÓN ---
app.put('/api/events/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, date, time, location_id } = req.body;
      
      // 1. VALIDACIÓN AL EDITAR TAMBIÉN
      if (isPastDate(date, time)) {
        return res.status(400).json({ error: "No puedes mover un evento al pasado." });
      }

      console.log(`📝 Actualizando evento ${id} con hora: ${time}`);

      const result = await pool.query(
        "UPDATE events SET title=$1, description=$2, date=$3, time=$4, location_id=$5 WHERE id=$6 RETURNING *",
        [title, description, date, time, parseInt(location_id), id]
      );
      
      if (result.rows.length === 0) return res.status(404).json({ error: "Evento no encontrado" });
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error SQL: " + err.message });
    }
});

// ELIMINAR EVENTO (DELETE)
app.delete('/api/events/:id', verifyToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM events WHERE id = $1", [req.params.id]);
    res.json({ message: "Eliminado" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend listo en http://localhost:${PORT}`);
});