const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// --- NUEVOS IMPORTS PARA OAUTH ---
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

// 1. IMPORTAR RUTAS Y MIDDLEWARE
const locationRoutes = require('./routes/locations');
const verifyToken = require('./authMiddleware');
const { sendEventNotification } = require('./emailService');

const app = express();

// Configuración de CORS y JSON
app.use(cors());
app.use(express.json());
// Inicializar Passport (necesario para OAuth)
app.use(passport.initialize());

// 2. CONFIGURACIÓN BASE DE DATOS (PostgreSQL)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const SECRET_KEY = process.env.JWT_SECRET;

// --- 3. CONFIGURACIÓN PASSPORT (GOOGLE OAUTH) ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // A. Buscar si el usuario ya existe con ese Google ID
      const res = await pool.query("SELECT * FROM users WHERE google_id = $1", [profile.id]);
      
      if (res.rows.length > 0) {
        return done(null, res.rows[0]);
      } 
      
      // B. Si no tiene Google ID, buscar por email (para vincular cuentas)
      const email = profile.emails[0].value;
      const emailRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      
      if (emailRes.rows.length > 0) {
        const user = emailRes.rows[0];
        // Actualizamos el usuario para agregarle el Google ID y el Avatar
        await pool.query(
          "UPDATE users SET google_id = $1, avatar = $2 WHERE email = $3", 
          [profile.id, profile.photos[0]?.value, email]
        );
        return done(null, user);
      } 
      
      // C. Si no existe, crear usuario nuevo
      // Nota: password es NULL porque entra con Google
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


// --- 4. CONEXIÓN DE RUTAS (Endpoints) ---

// A. RUTAS OAUTH (GOOGLE)
// 1. Iniciar el flujo (Redirige a Google)
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Callback (Google nos devuelve al usuario)
app.get('/auth/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login?error=auth_failed' }),
  (req, res) => {
    // Autenticación exitosa, generamos JWT
    const user = req.user;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      SECRET_KEY, 
      { expiresIn: '24h' }
    );

    // Redirigimos al Frontend enviando el token en la URL
    res.redirect(`http://localhost:5173/login?token=${token}&role=${user.role}&email=${user.email}`);
  }
);


// B. RUTA DE UBICACIONES
app.use('/api/locations', locationRoutes); 

// C. RUTA DE PRUEBA
app.get('/', (req, res) => {
  res.send('Backend UCE funcionando correctamente 🚀');
});

// D. RUTA DE REGISTRO
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

// E. RUTA DE LOGIN (Clásico)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (userResult.rows.length === 0) return res.status(400).json({ error: "Usuario no encontrado" });

    const user = userResult.rows[0];

    // Si el usuario se creó con Google, puede no tener password
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

// F. RUTA DE VISITAS
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

// G. RUTAS DE EVENTOS (CONECTADAS A SQL)
// 1. Obtener Eventos
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

// 2. Crear Evento
app.post('/api/events', verifyToken, async (req, res) => {
  try {
    const { title, description, date, location_id } = req.body;

    const newEvent = await pool.query(
      "INSERT INTO events (title, description, date, location_id) VALUES($1, $2, $3, $4) RETURNING *",
      [title, description, date, location_id]
    );

    console.log("✅ Evento guardado en SQL ID:", newEvent.rows[0].id);

    // --- Lógica de Correos ---
    console.log("🔍 Buscando usuarios para notificar...");
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

// --- INICIAR SERVIDOR ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend listo en http://localhost:${PORT}`);
  console.log(`📡 Conectado a DB: ${process.env.DB_NAME} como ${process.env.DB_USER}`);
});