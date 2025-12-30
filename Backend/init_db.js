const pool = require('./db_postgres');
const bcrypt = require('bcryptjs');

const init = async () => {
  try {
    console.log("⏳ Creando tablas en PostgreSQL...");

    // 1. Crear tabla de USUARIOS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user'
      );
    `);

    // 2. Crear tabla de EVENTOS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        date VARCHAR(50),
        time VARCHAR(50),
        capacity INT,
        registered INT DEFAULT 0
      );
    `);

    // 3. Crear usuario ADMIN por defecto (si no existe)
    const checkAdmin = await pool.query("SELECT * FROM users WHERE email = 'admin@uce.edu.ec'");
    
    if (checkAdmin.rows.length === 0) {
      // Encriptar contraseña "admin"
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin", salt);

      await pool.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
        ['admin@uce.edu.ec', hashedPassword, 'admin']
      );
      console.log("✅ Usuario Admin creado: admin@uce.edu.ec / admin");
    } else {
      console.log("ℹ️ El usuario Admin ya existía.");
    }

    console.log("🚀 Base de datos inicializada correctamente.");
    process.exit(0);
  } catch (err) {
    console.error("🔴 Error inicializando DB:", err);
    process.exit(1);
  }
};

init();