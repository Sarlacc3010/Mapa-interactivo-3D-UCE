const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // 🔥 Para generar tokens únicos

require('dotenv').config();

// --- 1. CONFIGURACIONES Y SERVICIOS ---
const pool = require('./src/config/db'); 
const redisClient = require('./src/config/redis'); 
require('./src/config/passport'); 

// 🔥 Importamos el servicio de correo
const { sendVerificationEmail } = require('./src/services/mailService');

// --- 2. RUTAS ---
const locationRoutes = require('./src/routes/locations');
const eventsRoutes = require('./src/routes/eventsRoutes'); 
const analyticsRoutes = require('./src/routes/analyticsRoutes'); 
const authMiddleware = require('./src/middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 3. CONFIGURACIÓN DEL SERVIDOR WEBSOCKET
// ==========================================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado al Socket: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// ==========================================
// 4. MIDDLEWARES GLOBALES
// ==========================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Configuración de Cookies para JWT
const COOKIE_OPTIONS = {
  httpOnly: true, // No accesible por JavaScript del lado cliente (seguridad XSS)
  secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 horas
};

// ==========================================
// 5. ARCHIVOS ESTÁTICOS (IMÁGENES)
// ==========================================
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ==========================================
// 6. RUTAS (ENDPOINTS)
// ==========================================

// A. Rutas Modulares
app.use('/api/locations', locationRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/analytics', analyticsRoutes); 

// B. Rutas de Autenticación (LOGIN/REGISTER/VERIFY)
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SECRET_KEY = process.env.JWT_SECRET;

// --- LOGIN CON GOOGLE ---
// Los usuarios de Google se crean automáticamente verificados (is_verified = TRUE) en passport.js
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
    // Enviamos la cookie segura
    res.cookie('access_token', token, COOKIE_OPTIONS);
    res.redirect(`http://localhost:5173/?loginSuccess=true&role=${user.role}`);
  }
);

// --- LOGIN NORMAL ---
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) return res.status(400).json({ error: "Usuario no encontrado" });

    const user = userResult.rows[0];

    // 🔥 BLOQUEO DE SEGURIDAD: VERIFICACIÓN DE CORREO
    if (!user.is_verified) {
       return res.status(403).json({ error: "Tu cuenta no está verificada. Revisa tu correo electrónico." });
    }

    if (!user.password) return res.status(400).json({ error: "Por favor usa Google para iniciar sesión" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

    // Generar Token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, faculty_id: user.faculty_id },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    
    // Enviar Cookie y Respuesta
    res.cookie('access_token', token, COOKIE_OPTIONS);
    res.json({
      message: "Inicio de sesión exitoso",
      user: { email: user.email, role: user.role, faculty_id: user.faculty_id }
    });
  } catch (err) { res.status(500).json({ error: "Error en el servidor" }); }
});

// --- REGISTRO DE USUARIO ---
app.post("/api/register", async (req, res) => {
  const { email, password, name, faculty_id } = req.body;
  
  // Logs para depuración en servidor
  console.log("📩 Intentando registrar:", email);

  try {
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) return res.status(401).json({ error: "El usuario ya existe" });

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);
    let role = email.endsWith('@uce.edu.ec') ? 'student' : 'visitor';

    // Generar Token aleatorio de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 1. Insertar usuario en DB (is_verified = FALSE)
    await pool.query(
      `INSERT INTO users (email, password, role, name, faculty_id, is_verified, verification_token) 
       VALUES ($1, $2, $3, $4, $5, FALSE, $6)`,
      [email, bcryptPassword, role, name || null, faculty_id || null, verificationToken]
    );

    // 2. Enviar Correo (OBLIGATORIO ESPERAR RESPUESTA)
    console.log("📨 Enviando correo a:", email);
    try {
      // Usamos await para asegurar que si falla, salte al catch
      await sendVerificationEmail(email, verificationToken);
      console.log("✅ Correo enviado con éxito");
    } catch (emailError) {
      console.error("❌ FALLÓ EL ENVÍO DE CORREO:", emailError);
      
      // 🔥 IMPORTANTE: Si falla el correo, borramos al usuario para que pueda intentar de nuevo
      await pool.query("DELETE FROM users WHERE email = $1", [email]);
      
      return res.status(500).json({ 
        error: "No se pudo enviar el correo de verificación. Inténtalo de nuevo más tarde." 
      });
    }

    // 3. Responder al usuario SOLO si el correo se envió
    return res.json({ 
      message: "Registro exitoso. Revisa tu correo para verificar tu cuenta antes de iniciar sesión." 
    });

  } catch (err) {
    console.error("❌ Error en registro:", err);
    res.status(500).json({ error: "Error en el servidor", details: err.message });
  }
});

// --- VERIFICACIÓN DE EMAIL (Endpoint Nuevo) ---
app.post('/api/verify-email', async (req, res) => {
  const { token } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE verification_token = $1", [token]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    const user = result.rows[0];

    // Activar usuario y limpiar el token
    await pool.query(
      "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1", 
      [user.id]
    );

    res.json({ message: "Cuenta verificada con éxito" });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: "Error verificando cuenta" }); 
  }
});

// --- CERRAR SESIÓN ---
app.post('/api/logout', (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: "Sesión cerrada" });
});

// --- PERFIL DE USUARIO ---
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query("SELECT id, email, role, faculty_id, name, avatar, google_id FROM users WHERE id = $1", [req.user.id]);
    if (userResult.rows.length > 0) res.json({ user: userResult.rows[0] });
    else res.status(404).json({ error: "Usuario no encontrado" });
  } catch (error) { res.status(500).json({ error: "Error obteniendo perfil" }); }
});

// ==========================================
// 7. INICIAR SERVIDOR
// ==========================================
server.listen(PORT, () => {
  console.log(`🚀 Servidor Backend listo en http://localhost:${PORT}`);
});