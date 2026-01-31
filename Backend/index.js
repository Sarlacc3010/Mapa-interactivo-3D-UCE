const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // Used for generating unique tokens
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

require('dotenv').config();

// --- 1. CONFIGURATIONS AND SERVICES ---
const pool = require('./src/config/db'); 
const redisClient = require('./src/config/redis'); 
const { logger } = require('./src/utils/logger'); // New Winston Logger
require('./src/config/passport'); 

// Import mail service
const { sendVerificationEmail } = require('./src/services/mailService');

// --- 2. ROUTES IMPORTS ---
const locationRoutes = require('./src/routes/locations');
const eventsRoutes = require('./src/routes/eventsRoutes'); 
const analyticsRoutes = require('./src/routes/analyticsRoutes'); 
const authMiddleware = require('./src/middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET;

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

// Attach Socket.io instance to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  logger.info('SOCKET_CONNECT', { details: `Client connected: ${socket.id}` });
  
  socket.on('disconnect', () => {
    logger.info('SOCKET_DISCONNECT', { details: `Client disconnected: ${socket.id}` });
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

// Cookie Configuration for JWT
const COOKIE_OPTIONS = {
  httpOnly: true, // Not accessible via client-side JavaScript (XSS protection)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
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
app.use('/api/analytics', analyticsRoutes); 

// B. Authentication Routes (LOGIN/REGISTER/VERIFY)

// --- GOOGLE LOGIN ---
// Google users are automatically created as verified (is_verified = TRUE) in passport.js
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
    
    // Log successful Google login
    logger.info('LOGIN_GOOGLE', { user_email: user.email, details: 'User logged in via Google OAuth' });

    // Send secure cookie
    res.cookie('access_token', token, COOKIE_OPTIONS);
    res.redirect(`http://localhost:5173/?loginSuccess=true&role=${user.role}`);
  }
);

// --- GUEST LOGIN (NEW FEATURE) ---
app.post('/api/login/guest', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    // Generate a temporary guest identity
    const guestUser = {
      id: `guest_${Date.now()}`,
      email: 'guest@anonymous',
      name: 'Visitante',
      role: 'guest',
      faculty_id: null
    };

    // Sign a temporary token valid for 2 hours
    const token = jwt.sign(guestUser, SECRET_KEY, { expiresIn: '2h' });

    // Log the guest access
    logger.info('GUEST_ACCESS', { details: 'Anonymous user entered guest mode', ip_address: ip });

    res.cookie('access_token', token, COOKIE_OPTIONS);
    res.json({
      message: "Guest access granted",
      user: guestUser
    });
  } catch (err) {
    logger.error('GUEST_LOGIN_FAIL', { details: err.message, ip_address: ip });
    res.status(500).json({ error: "Server error during guest login" });
  }
});

// --- STANDARD LOGIN ---
app.post('/api/login', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  try {
    const { email, password } = req.body;
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      logger.warn('LOGIN_FAIL', { details: 'User not found', user_email: email, ip_address: ip });
      return res.status(400).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // SECURITY BLOCK: EMAIL VERIFICATION CHECK
    if (!user.is_verified) {
       logger.warn('LOGIN_BLOCKED', { details: 'Unverified email attempt', user_email: email });
       return res.status(403).json({ error: "Account not verified. Please check your email." });
    }

    if (!user.password) {
      return res.status(400).json({ error: "Please use Google to login" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.warn('LOGIN_FAIL', { details: 'Invalid password', user_email: email, ip_address: ip });
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, faculty_id: user.faculty_id },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    
    // Log success
    logger.info('LOGIN_SUCCESS', { user_email: email, ip_address: ip });

    // Send Cookie and Response
    res.cookie('access_token', token, COOKIE_OPTIONS);
    res.json({
      message: "Login successful",
      user: { email: user.email, role: user.role, faculty_id: user.faculty_id }
    });
  } catch (err) { 
    logger.error('LOGIN_ERROR', { details: err.message });
    res.status(500).json({ error: "Server error" }); 
  }
});

// --- USER REGISTRATION ---
app.post("/api/register", async (req, res) => {
  const { email, password, name, faculty_id } = req.body;
  
  try {
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(401).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);
    let role = email.endsWith('@uce.edu.ec') ? 'student' : 'visitor';

    // Generate random verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 1. Insert user into DB (is_verified = FALSE)
    await pool.query(
      `INSERT INTO users (email, password, role, name, faculty_id, is_verified, verification_token) 
       VALUES ($1, $2, $3, $4, $5, FALSE, $6)`,
      [email, bcryptPassword, role, name || null, faculty_id || null, verificationToken]
    );

    // 2. Send Email (MUST WAIT FOR RESPONSE)
    logger.info('REGISTER_ATTEMPT', { user_email: email, details: 'Sending verification email' });
    
    try {
      await sendVerificationEmail(email, verificationToken);
      logger.info('EMAIL_SENT', { user_email: email });
    } catch (emailError) {
      logger.error('EMAIL_FAIL', { details: emailError.message, user_email: email });
      
      // IMPORTANT: If email fails, delete user so they can try again
      await pool.query("DELETE FROM users WHERE email = $1", [email]);
      
      return res.status(500).json({ 
        error: "Could not send verification email. Please try again later." 
      });
    }

    // 3. Respond only if email was sent
    return res.json({ 
      message: "Registration successful. Please check your email to verify your account." 
    });

  } catch (err) {
    logger.error('REGISTER_ERROR', { details: err.message });
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// --- EMAIL VERIFICATION ---
app.post('/api/verify-email', async (req, res) => {
  const { token } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE verification_token = $1", [token]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const user = result.rows[0];

    // Activate user and clear token
    await pool.query(
      "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1", 
      [user.id]
    );

    logger.info('ACCOUNT_VERIFIED', { user_email: user.email });
    res.json({ message: "Account verified successfully" });

  } catch (err) { 
    logger.error('VERIFY_ERROR', { details: err.message });
    res.status(500).json({ error: "Error verifying account" }); 
  }
});

// --- LOGOUT ---
app.post('/api/logout', (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: "Logged out" });
});

// --- USER PROFILE ---
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query("SELECT id, email, role, faculty_id, name, avatar, google_id FROM users WHERE id = $1", [req.user.id]);
    if (userResult.rows.length > 0) res.json({ user: userResult.rows[0] });
    else res.status(404).json({ error: "User not found" });
  } catch (error) { res.status(500).json({ error: "Error fetching profile" }); }
});

// --- PROFILE UPDATE (NEW FEATURE) ---
app.put('/api/profile', authMiddleware, async (req, res) => {
  const { name, password } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  const userEmail = req.user.email;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    // SECURITY RULE: Students cannot change their registered name
    if (userRole === 'student' && name && name !== req.user.name) {
        logger.warn('UNAUTHORIZED_UPDATE', { 
          details: `Student attempted to change name to ${name}`,
          user_email: userEmail,
          ip_address: ip 
        });
        return res.status(403).json({ error: "Students cannot modify their registered name. Please contact academic support." });
    }

    let query = "UPDATE users SET ";
    let params = [];
    let idx = 1;
    let updates = [];

    // Only add name to update list if allowed (Admins or Visitors)
    if (name && (userRole === 'admin' || userRole === 'visitor')) {
        updates.push(`name = $${idx}`);
        params.push(name);
        idx++;
    }

    // Password update logic
    if (password && password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        updates.push(`password = $${idx}`);
        params.push(hash);
        idx++;
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
    }

    query += updates.join(", ") + ` WHERE id = $${idx} RETURNING id, name, email, role`;
    params.push(userId);

    const result = await pool.query(query, params);

    logger.info('PROFILE_UPDATE', { details: 'User credentials updated', user_email: userEmail, ip_address: ip });

    res.json({ 
      message: "Profile updated successfully", 
      user: result.rows[0] 
    });

  } catch (err) {
    logger.error('PROFILE_UPDATE_FAIL', { details: err.message, user_email: userEmail });
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ==========================================
// 7. START SERVER
// ==========================================
server.listen(PORT, () => {
  logger.info('SERVER_START', { details: `Backend server running on http://localhost:${PORT}` });
});