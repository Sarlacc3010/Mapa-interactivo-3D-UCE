const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const initDB = async () => {
  try {
    // 1. CREAR TABLAS BASE (Si no existen)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255), -- Puede ser null si entra con Google
        role VARCHAR(50) DEFAULT 'visitor',
        google_id VARCHAR(255),
        avatar TEXT,
        faculty_id INTEGER, -- Nueva columna para estudiantes
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        date DATE,
        time TIME,
        capacity INTEGER,
        location_id INTEGER, -- Vinculado a locations
        created_by INTEGER REFERENCES users(id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        location_id VARCHAR(255) NOT NULL,
        visitor_email VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. MIGRACIÓN: ACTUALIZAR TABLA USERS EXISTENTE
    // Esto agregará las columnas si ya tenías la base creada
    console.log("🔄 Verificando estructura de tablas...");
    try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty_id INTEGER`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`);
        console.log("✅ Tabla 'users' actualizada con nuevas columnas.");
    } catch (e) {
        console.log("ℹ️ Las columnas ya existían o hubo un error menor:", e.message);
    }

    // 3. CREAR ADMIN
    const adminExist = await pool.query("SELECT * FROM users WHERE email = 'admin-mapa@uce.edu.ec'");
    if (adminExist.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);
      await pool.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
        ['admin-mapa@uce.edu.ec', hashedPassword, 'admin']
      );
      console.log("👤 Usuario Admin creado.");
    }

    console.log("🚀 Base de datos lista y actualizada.");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

initDB();