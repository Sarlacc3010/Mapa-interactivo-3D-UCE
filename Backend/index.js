const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const compression = require('compression'); // Gzip compression
require('dotenv').config();

// CONFIGURATIONS
const pool = require('./src/config/db');
const { connectRedis } = require('./src/config/redis'); // Import connection function
const { logger } = require('./src/utils/logger');
require('./src/config/passport');

// SERVICES
const { sendVerificationEmail } = require('./src/services/mailService');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET;

// GLOBAL MIDDLEWARE
app.use(cors({
    origin: ['http://localhost', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());

// GZIP COMPRESSION: Reduces response size by 60-80%
app.use(compression({
    filter: (req, res) => {
        // Do not compress if client requests it
        if (req.headers['x-no-compression']) {
            return false;
        }
        // Compress everything else
        return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression (1-9, default: 6)
    threshold: 1024, // Only compress responses > 1KB
}));

app.use(cookieParser());
app.use(passport.initialize());

// STATIC FILES
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// ==========================================
// SAFE SERVER STARTUP
// ==========================================
const startServer = async () => {
    try {
        // 1. Verify PostgreSQL
        await pool.query('SELECT 1');
        console.log("✅ [DB] PostgreSQL conectado");

        // 2. Connect Redis (Wait for completion before proceeding)
        await connectRedis();

        // 3. Configure WebSockets and HTTP Server (BEFORE LOADING ROUTES)
        const server = http.createServer(app);
        const io = new Server(server, {
            cors: { origin: ['http://localhost', 'http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }
        });

        // 4. Middleware to inject io into req (BEFORE LOADING ROUTES)
        app.use((req, res, next) => { req.io = io; next(); });

        io.on('connection', (socket) => {
            logger.info('SOCKET_CONNECT', { details: `Client connected: ${socket.id}` });
            socket.on('disconnect', () => {
                logger.info('SOCKET_DISCONNECT', { details: `Client disconnected: ${socket.id}` });
            });
        });

        // 5. Load Routes (AFTER configuring io)
        console.log("📡 Cargando rutas...");
        app.use('/api/locations', require('./src/routes/locations'));
        app.use('/api/events', require('./src/routes/events'));
        app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
        app.use('/api/calendar', require('./src/routes/calendar'));

        // 6. Configure Authentication Routes
        setupAuthRoutes(app);

        // 7. START LISTENING
        server.listen(PORT, () => {
            logger.info('SERVER_START', { details: `Backend server running on http://localhost:${PORT}` });
        });

    } catch (error) {
        console.error("❌ [FATAL] Error iniciando servidor:", error);
        process.exit(1);
    }
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
function setupAuthRoutes(app) {
    const COOKIE_OPTIONS = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    };

    // Google Auth
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    app.get('/auth/google/callback',
        passport.authenticate('google', {
            session: false,
            failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`
        }),
        (req, res) => {
            const user = req.user;
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role, faculty_id: user.faculty_id }, SECRET_KEY, { expiresIn: '24h' });
            logger.info('LOGIN_GOOGLE', { user_email: user.email });
            res.cookie('access_token', token, COOKIE_OPTIONS);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}/?loginSuccess=true&role=${user.role}`);
        }
    );

    // Guest Login
    app.post('/api/login/guest', async (req, res) => {
        try {
            const guestUser = { id: `guest_${Date.now()}`, email: 'guest@anonymous', name: 'Visitante', role: 'guest', faculty_id: null };
            const token = jwt.sign(guestUser, SECRET_KEY, { expiresIn: '2h' });
            logger.info('GUEST_ACCESS', { details: 'Anonymous user entered guest mode' });
            res.cookie('access_token', token, COOKIE_OPTIONS);
            res.json({ message: "Guest access granted", user: guestUser });
        } catch (err) { res.status(500).json({ error: "Server error" }); }
    });

    // Standard Login
    app.post('/api/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
            if (userResult.rows.length === 0) return res.status(400).json({ error: "User not found" });

            const user = userResult.rows[0];
            if (!user.is_verified) return res.status(403).json({ error: "Account not verified." });
            if (!user.password) return res.status(400).json({ error: "Please use Google to login" });

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) return res.status(400).json({ error: "Invalid password" });

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role, faculty_id: user.faculty_id }, SECRET_KEY, { expiresIn: '24h' });
            logger.info('LOGIN_SUCCESS', { user_email: email });
            res.cookie('access_token', token, COOKIE_OPTIONS);
            res.json({ message: "Login successful", user: { email: user.email, role: user.role, faculty_id: user.faculty_id } });
        } catch (err) { res.status(500).json({ error: "Server error" }); }
    });

    // Register
    app.post("/api/register", async (req, res) => {
        const { email, password, name, faculty_id } = req.body;
        try {
            const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
            if (userCheck.rows.length > 0) return res.status(401).json({ error: "User already exists" });
            const salt = await bcrypt.genSalt(10);
            const bcryptPassword = await bcrypt.hash(password, salt);
            let role = email.endsWith('@uce.edu.ec') ? 'student' : 'visitor';
            const verificationToken = crypto.randomBytes(32).toString('hex');

            await pool.query(`INSERT INTO users (email, password, role, name, faculty_id, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5, FALSE, $6)`, [email, bcryptPassword, role, name || null, faculty_id || null, verificationToken]);

            try { await sendVerificationEmail(email, verificationToken); }
            catch (e) {
                await pool.query("DELETE FROM users WHERE email = $1", [email]);
                return res.status(500).json({ error: "Email error" });
            }
            res.json({ message: "Registration successful. Please check your email." });
        } catch (err) { res.status(500).json({ error: "Server error" }); }
    });

    // Verify Email
    app.post('/api/verify-email', async (req, res) => {
        const { token } = req.body;
        try {
            const result = await pool.query("SELECT * FROM users WHERE verification_token = $1", [token]);
            if (result.rows.length === 0) return res.status(400).json({ error: "Invalid token" });
            await pool.query("UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1", [result.rows[0].id]);
            res.json({ message: "Account verified successfully" });
        } catch (err) { res.status(500).json({ error: "Error verifying" }); }
    });

    // Logout
    app.post('/api/logout', (req, res) => {
        res.clearCookie('access_token');
        res.json({ message: "Logged out" });
    });

    // Profile
    app.get('/api/profile', require('./src/middlewares/authMiddleware'), async (req, res) => {
        try {
            const r = await pool.query("SELECT id, email, role, faculty_id, name, avatar, google_id FROM users WHERE id = $1", [req.user.id]);
            if (r.rows.length > 0) res.json({ user: r.rows[0] }); else res.status(404).json({ error: "User not found" });
        } catch (e) { res.status(500).json({ error: "Error fetching profile" }); }
    });

    // Profile Update
    app.put('/api/profile', require('./src/middlewares/authMiddleware'), async (req, res) => {
        const { name, password } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        try {
            if (userRole === 'student' && name && name !== req.user.name) {
                return res.status(403).json({ error: "Students cannot modify their registered name." });
            }
            let query = "UPDATE users SET ";
            let params = [];
            let idx = 1;
            let updates = [];

            if (name && (userRole === 'admin' || userRole === 'visitor')) {
                updates.push(`name = $${idx}`); params.push(name); idx++;
            }
            if (password && password.trim() !== "") {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(password, salt);
                updates.push(`password = $${idx}`); params.push(hash); idx++;
            }

            if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

            query += updates.join(", ") + ` WHERE id = $${idx} RETURNING id, name, email, role`;
            params.push(userId);
            const result = await pool.query(query, params);
            res.json({ message: "Profile updated", user: result.rows[0] });
        } catch (err) { res.status(500).json({ error: "Update failed" }); }
    });
}

// EXECUTE STARTUP
startServer();