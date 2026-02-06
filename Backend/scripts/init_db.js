// Backend/scripts/init_db.js
// CHANGE: Import centralized connection (go up one level with ..)
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

const initDB = async () => {
  try {
    console.log("Starting Database configuration...");

    // 1. CREATE BASE TABLES
    // Table users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'visitor',
        google_id VARCHAR(255),
        avatar TEXT,
        faculty_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table locations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(50),
          coordinates JSONB, -- Using JSONB to save {x, y, z}
          object3d_id VARCHAR(100),
          faculty_id INTEGER,
          image_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table events
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE,
        time TIME,
        end_time TIME,
        location_id INTEGER REFERENCES locations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table visits
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        location_id INTEGER REFERENCES locations(id), -- Ensure it is an integer
        visitor_email VARCHAR(255),
        visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. CREATE ADMIN (If not exists)
    const adminExist = await pool.query("SELECT * FROM users WHERE email = 'admin-mapa@uce.edu.ec'");
    if (adminExist.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);
      await pool.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
        ['admin-mapa@uce.edu.ec', hashedPassword, 'admin']
      );
      console.log("Admin User created.");
    }

    console.log("Database initialized successfully.");
    process.exit();
  } catch (err) {
    console.error("Error initializing DB:", err);
    process.exit(1);
  }
};

initDB();