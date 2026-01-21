const pool = require('../config/db'); // Importamos la DB
const redisClient = require('../config/redis'); // Importamos Redis
const { sendEventNotification } = require('../services/mailService'); // Importamos el servicio de correo

// Helper para validar fechas pasadas
const isPastDate = (dateStr, timeStr) => {
  const eventDate = new Date(`${dateStr}T${timeStr || '00:00:00'}`);
  const now = new Date();
  return eventDate < now;
};

// 1. OBTENER EVENTOS
const getEvents = async (req, res) => {
  try {
    const cachedEvents = await redisClient.get('all_events');
    if (cachedEvents) return res.json(JSON.parse(cachedEvents));

    const query = `
      SELECT e.*, l.name as location_name 
      FROM events e 
      JOIN locations l ON e.location_id = l.id
      ORDER BY e.date ASC
    `;
    const allEvents = await pool.query(query);
    await redisClient.set('all_events', JSON.stringify(allEvents.rows), { EX: 3600 });
    
    res.json(allEvents.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error del servidor");
  }
};

// 2. CREAR EVENTO (AQUÍ AGREGAMOS EL CORREO) 🔥
const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, end_time, location_id } = req.body;

    if (isPastDate(date, end_time || time)) {
        return res.status(400).json({ error: "Fecha inválida (pasado)." });
    }

    // A. Guardar en BD
    const newEvent = await pool.query(
      "INSERT INTO events (title, description, date, time, end_time, location_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description, date, time, end_time, location_id]
    );

    // B. Invalidar caché y Notificar Socket
    await redisClient.del('all_events');
    req.io.emit('server:data_updated', { type: 'EVENT_ADDED', data: newEvent.rows[0] });

    // 🔥 C. ENVIAR CORREOS (Lógica Nueva) 🔥
    // -----------------------------------------------------
    // 1. Obtener correos de estudiantes
    const usersResult = await pool.query("SELECT email FROM users WHERE role = 'student'");
    const emails = usersResult.rows.map(u => u.email);

    // 2. Obtener nombre del lugar (Join manual rápido)
    const locResult = await pool.query("SELECT name FROM locations WHERE id = $1", [location_id]);
    const locationName = locResult.rows[0] ? locResult.rows[0].name : "Campus UCE";

    // 3. Enviar sin esperar (fire and forget)
    if (emails.length > 0) {
        sendEventNotification(emails, title, `${date} ${time}`, description, locationName)
            .catch(err => console.error("❌ Error enviando emails:", err));
    }
    // -----------------------------------------------------

    res.json(newEvent.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// 3. ACTUALIZAR EVENTO
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
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
};

// 4. ELIMINAR EVENTO
const deleteEvent = async (req, res) => {
  try {
    await pool.query("DELETE FROM events WHERE id = $1", [req.params.id]);
    
    await redisClient.del('all_events');
    req.io.emit('server:data_updated', { type: 'EVENT_DELETED', id: req.params.id });
    
    res.json({ message: "Eliminado" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };