const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');
// --- 1. IMPORTACIONES NUEVAS PARA SOCKETS ---
const http = require('http'); 
const { Server } = require('socket.io');
// --------------------------------------------
require('dotenv').config();

// Redis
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
// 2. CONFIGURACIÓN DEL SERVIDOR WEBSOCKET
// ==========================================
// Envolvemos la app de Express en un servidor HTTP nativo
const server = http.createServer(app);

// Inicializamos Socket.io
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Tus orígenes permitidos
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware para inyectar 'io' en todas las peticiones
// Esto permite usar req.io.emit(...) en cualquier ruta (incluida locations.js)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Escuchar conexiones de clientes (Solo para debug)
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado al Socket: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// ==========================================
// 3. MIDDLEWARES GLOBALES
// ==========================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Configuración de Cookies
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 horas
};

// ==========================================
// 4. CONFIGURACIÓN DE IMÁGENES
// ==========================================
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ==========================================
// 5. CONEXIÓN BASE DE DATOS SQL (Postgres)
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
// 6. CONEXIÓN REDIS
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
// 7. GOOGLE OAUTH
// ==========================================
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
          "INSERT INTO users (email, google_id, role, avatar, faculty_id) VALUES ($1, $2, $3, $4, NULL) RETURNING *",
          [email, profile.id, 'visitor', profile.photos[0]?.value]
        );
        return done(null, newUser.rows[0]);
      } catch (err) { return done(err, null); }
    }
  ));
}

// ==========================================
// 8. RUTAS DE AUTENTICACIÓN
// ==========================================
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login?error=auth_failed' }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, faculty_id: user.faculty_id },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    res.cookie('access_token', token, COOKIE_OPTIONS);
    res.redirect(`http://localhost:5173/?loginSuccess=true&role=${user.role}`);
  }
);

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) return res.status(400).json({ error: "Usuario no encontrado" });

    const user = userResult.rows[0];
    if (!user.password) return res.status(400).json({ error: "Usa Google para ingresar" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, faculty_id: user.faculty_id },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    res.cookie('access_token', token, COOKIE_OPTIONS);
    res.json({
      message: "Login exitoso",
      user: { email: user.email, role: user.role, faculty_id: user.faculty_id }
    });
  } catch (err) { res.status(500).json({ error: "Error de servidor" }); }
});

app.post("/api/register", async (req, res) => {
  const { email, password, name, faculty_id } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length > 0) {
      return res.status(401).json({ error: "El usuario ya existe" });
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    let role = 'visitor';
    if (email.endsWith('@uce.edu.ec')) {
      role = 'student';
    }

    const newUser = await pool.query(
      `INSERT INTO users (email, password, role, name, faculty_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [email, bcryptPassword, role, name || null, faculty_id || null]
    );

    const token = jwt.sign(
      { id: newUser.rows[0].id, email: newUser.rows[0].email, role: role, faculty_id: faculty_id || null },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });

    return res.json({ token, user: newUser.rows[0] });

  } catch (err) {
    console.error("Error en registro:", err.message);
    res.status(500).json({ error: "Error en el servidor", details: err.message });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('token');
  res.json({ message: "Sesión cerrada" });
});

app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const userResult = await pool.query("SELECT id, email, role, faculty_id, name, avatar, google_id FROM users WHERE id = $1", [req.user.id]);

    if (userResult.rows.length > 0) {
      res.json({ user: userResult.rows[0] });
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo perfil" });
  }
});

// ==========================================
// 9. RUTAS DE DATOS (PROTEGIDAS)
// ==========================================

app.use('/api/locations', locationRoutes);

const isPastDate = (dateStr, timeStr) => {
  const eventDate = new Date(`${dateStr}T${timeStr || '00:00:00'}`);
  const now = new Date();
  return eventDate < now;
};

// --- API EVENTOS (OPTIMIZADO CON REDIS + SOCKETS) ---

// ==========================================
// 1. GET EVENTOS (PÚBLICO) - CON JOIN
// ==========================================
app.get('/api/events', async (req, res) => {
  try {
    // 1. Intentar sacar de Redis
    const cachedEvents = await redisClient.get('all_events');
    
    if (cachedEvents) {
      // OJO: Si acabas de borrar la caché, esto dará null y pasará al paso 2
      return res.json(JSON.parse(cachedEvents));
    }

    // 2. Si no hay caché, buscar en Postgres CON JOIN
    // 🔥 EL CAMBIO CLAVE ESTÁ AQUÍ ABAJO:
    const query = `
      SELECT e.*, l.name as location_name 
      FROM events e 
      JOIN locations l ON e.location_id = l.id
      ORDER BY e.date ASC
    `;
    
    const allEvents = await pool.query(query);

    // 3. Guardar en Redis el resultado COMPLETO (con el nombre incluido)
    await redisClient.set('all_events', JSON.stringify(allEvents.rows), { EX: 3600 });

    res.json(allEvents.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error del servidor");
  }
});

// 2. POST Eventos
app.post('/api/events', verifyToken, async (req, res) => {
  try {
    // 🔥 AHORA RECIBIMOS end_time
    const { title, description, date, time, end_time, location_id } = req.body;

    // Validación básica
    if (isPastDate(date, end_time || time)) return res.status(400).json({ error: "Fecha inválida (pasado)." });

    const newEvent = await pool.query(
      "INSERT INTO events (title, description, date, time, end_time, location_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description, date, time, end_time, location_id]
    );

    await redisClient.del('all_events');
    req.io.emit('server:data_updated', { type: 'EVENT_ADDED', data: newEvent.rows[0] });

    // (Opcional) Enviar correos...

    res.json(newEvent.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. PUT Eventos
app.put('/api/events/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // 🔥 RECIBIMOS end_time TAMBIÉN AQUÍ
    const { title, description, date, time, end_time, location_id } = req.body;

    const result = await pool.query(
      "UPDATE events SET title=$1, description=$2, date=$3, time=$4, end_time=$5, location_id=$6 WHERE id=$7 RETURNING *",
      [title, description, date, time, end_time, parseInt(location_id), id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Evento no encontrado" });

    await redisClient.del('all_events');
    req.io.emit('server:data_updated', { type: 'EVENT_UPDATED', data: result.rows[0] });

    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Error SQL: " + err.message }); }
});

// 4. DELETE Eventos
app.delete('/api/events/:id', verifyToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM events WHERE id = $1", [req.params.id]);
    
    // --- MAGIA: INVALIDAR CACHÉ Y NOTIFICAR EN VIVO ---
    await redisClient.del('all_events');

    // 🔥 ENVIAR NOTIFICACIÓN SOCKET
    req.io.emit('server:data_updated', { type: 'EVENT_DELETED', id: req.params.id });
    
    res.json({ message: "Eliminado" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API VISITAS ---
app.post('/visits', verifyToken, async (req, res) => {
  try {
    const { location_id } = req.body;
    const userEmail = req.user.email;
    await pool.query("INSERT INTO visits (location_id, visitor_email) VALUES ($1, $2)", [location_id, userEmail]);
    res.json({ message: "Visita registrada" });
  } catch (err) { res.status(500).json({ error: "Error al registrar visita" }); }
});

// ==========================================
// RUTA: ESTADÍSTICAS POR HORA (Para Gráfica de Área)
// ==========================================
app.get('/api/analytics/peak-hours', verifyToken, async (req, res) => {
    try {
        // Consulta SQL PRO: Agrupa las visitas por hora del día actual
        const query = `
            SELECT 
                EXTRACT(HOUR FROM visit_date) as hour, 
                COUNT(*) as count 
            FROM visits 
            WHERE visit_date >= CURRENT_DATE 
            GROUP BY hour 
            ORDER BY hour ASC;
        `;
        
        const result = await pool.query(query);
        
        // Formateamos para que el Frontend lo lea fácil (rellenamos horas vacías)
        const fullDayStats = Array.from({ length: 24 }, (_, i) => {
            const found = result.rows.find(r => parseInt(r.hour) === i);
            return {
                name: `${i}:00`, // Etiqueta X (08:00)
                visitas: found ? parseInt(found.count) : 0 // Valor Y
            };
        });

        res.json(fullDayStats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error calculando estadísticas" });
    }
});

// ==========================================
// 10. INICIAR SERVIDOR (USANDO SERVER.LISTEN)
// ==========================================
// IMPORTANTE: Cambiamos app.listen por server.listen para que funcionen los sockets
server.listen(PORT, () => {
  console.log(`🚀 Servidor Backend + Sockets listo en http://localhost:${PORT}`);
});