const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

// --- 1. IMPORT CONFIGURATIONS AND SERVICES ---
// We import connections instead of creating them here
const pool = require('./src/config/db'); 
const redisClient = require('./src/config/redis'); 
require('./src/config/passport'); // This loads the Google Strategy automatically

// --- 2. IMPORT ROUTES ---
const locationRoutes = require('./src/routes/locations');
const eventsRoutes = require('./src/routes/eventsRoutes'); 
const analyticsRoutes = require('./src/routes/analyticsRoutes'); // 🔥 NEW: Analytics Routes
const authMiddleware = require('./src/middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 3. WEBSOCKET SERVER CONFIGURATION
// ==========================================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware to inject 'io' into every request
// This allows using req.io.emit(...) in any route
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected to Socket: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ==========================================
// 4. GLOBAL MIDDLEWARES
// ==========================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

// ==========================================
// 5. STATIC FILES (IMAGES)
// ==========================================
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ==========================================
// 6. ROUTES (ENDPOINTS)
// ==========================================

// A. Modular Routes
app.use('/api/locations', locationRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/analytics', analyticsRoutes); // 🔥 Connects the Dashboard charts

// B. Authentication Routes (LOGIN/REGISTER)
// TODO: Move this to 'src/controllers/authController.js' in the future.
// Kept here for now to ensure login stability.
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SECRET_KEY = process.env.JWT_SECRET;

// Google Callback
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

// Standard Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = userResult.rows[0];
    if (!user.password) return res.status(400).json({ error: "Please use Google to login" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, faculty_id: user.faculty_id },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    res.cookie('access_token', token, COOKIE_OPTIONS);
    res.json({
      message: "Login successful",
      user: { email: user.email, role: user.role, faculty_id: user.faculty_id }
    });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Register
app.post("/api/register", async (req, res) => {
  const { email, password, name, faculty_id } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length > 0) return res.status(401).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);
    let role = email.endsWith('@uce.edu.ec') ? 'student' : 'visitor';

    const newUser = await pool.query(
      `INSERT INTO users (email, password, role, name, faculty_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [email, bcryptPassword, role, name || null, faculty_id || null]
    );

    const token = jwt.sign(
      { id: newUser.rows[0].id, email: newUser.rows[0].email, role: role, faculty_id: faculty_id || null },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.cookie("access_token", token, COOKIE_OPTIONS);
    return res.json({ token, user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: "Session closed" });
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query("SELECT id, email, role, faculty_id, name, avatar, google_id FROM users WHERE id = $1", [req.user.id]);
    if (userResult.rows.length > 0) res.json({ user: userResult.rows[0] });
    else res.status(404).json({ error: "User not found" });
  } catch (error) { res.status(500).json({ error: "Error fetching profile" }); }
});

// ==========================================
// 7. START SERVER
// ==========================================
server.listen(PORT, () => {
  console.log(`🚀 Backend Server + Sockets ready at http://localhost:${PORT}`);
});