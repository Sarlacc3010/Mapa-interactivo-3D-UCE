const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Importar conexiones
const pool = require('./db_postgres');
const connectMongo = require('./db_mongo');

const app = express();
app.use(cors());
app.use(express.json());

// Clave secreta para firmar tokens (En producción va en .env)
const SECRET_KEY = "uce_secreto_super_seguro";

// Iniciar Mongo
connectMongo();

// --- RUTA DE REGISTRO (NUEVA) ---
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validar que no exista ya
    const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: "Este correo ya está registrado." });
    }

    // 2. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Guardar en Base de Datos (Por defecto rol = 'user')
    const newUser = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *",
      [email, hashedPassword, 'user']
    );

    // 4. Generar Token (Para que entre directo tras registrarse)
    const token = jwt.sign({ id: newUser.rows[0].id, role: 'user' }, SECRET_KEY, { expiresIn: '24h' });

    res.json({ 
      message: "Usuario creado exitosamente",
      token, 
      role: 'user', 
      email: newUser.rows[0].email 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario." });
  }
});

// --- RUTAS DE AUTENTICACIÓN (POSTGRES) ---

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar usuario
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];

    // 2. Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // 3. Generar Token
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });

    res.json({ 
      message: "Login exitoso",
      token, 
      role: user.role,
      email: user.email 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// --- RUTAS DE EVENTOS (POSTGRES) ---

// Obtener todos los eventos
app.get('/events', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nuevo evento
app.post('/events', async (req, res) => {
  try {
    const { title, description, location, date, time, capacity } = req.body;
    const newEvent = await pool.query(
      "INSERT INTO events (title, description, location, date, time, capacity) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description, location, date, time, capacity]
    );
    res.json(newEvent.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar evento
app.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM events WHERE id = $1", [id]);
    res.json({ message: "Evento eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend listo en http://localhost:${PORT}`);
});