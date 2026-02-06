const pool = require('../config/db');
const { sendEventNotification } = require('../services/mailService');
// 🔥 Nuevas utilidades compartidas
const { withCache, invalidateCache } = require('../utils/cacheUtils');
const { sendSuccess, sendError, sendNotFound, sendValidationError } = require('../utils/responseUtils');
const { validateRequiredFields } = require('../utils/validationUtils');

// =================================================================
// 🛠️ HELPER: VALIDAR FECHAS PASADAS
// =================================================================
const isPastDate = (dateStr, timeStr) => {
  // Combinamos fecha y hora (o 00:00 si no hay hora) para comparar
  const eventDate = new Date(`${dateStr}T${timeStr || '00:00:00'}`);
  const now = new Date();
  // Retorna true si la fecha del evento es menor (anterior) a ahora
  return eventDate < now;
};

// =================================================================
// 1. LECTURA (GET)
// =================================================================
const getEvents = async (req, res) => {
  try {
    // Usar wrapper de caché automático
    const events = await withCache('all_events', async () => {
      const query = `
        SELECT e.*, l.name as location_name 
        FROM events e 
        JOIN locations l ON e.location_id = l.id
        ORDER BY e.date DESC, e.time ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    }, 3600);

    sendSuccess(res, events);
  } catch (err) {
    sendError(res, err);
  }
};

const getEventsByLocation = async (req, res) => {
  try {
    const { id } = req.params;

    // Query que filtra eventos finalizados
    const query = `
      SELECT e.*, l.name as location_name 
      FROM events e 
      JOIN locations l ON e.location_id = l.id
      WHERE e.location_id = $1 
        AND (
          e.date > CURRENT_DATE 
          OR (e.date = CURRENT_DATE AND (e.end_time::TIME > CURRENT_TIME OR e.end_time IS NULL))
        )
      ORDER BY e.date ASC, e.time ASC
    `;

    const result = await pool.query(query, [id]);

    sendSuccess(res, result.rows);
  } catch (err) {
    sendError(res, err);
  }
};

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Evento');
    }

    sendSuccess(res, result.rows[0]);
  } catch (err) {
    sendError(res, err);
  }
};

// =================================================================
// 2. CREAR EVENTO (POST)
// =================================================================
const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, end_time, location_id } = req.body;

    // Validar campos requeridos
    const validation = validateRequiredFields(req.body, ['title', 'date', 'location_id']);
    if (!validation.isValid) {
      return sendValidationError(res, validation.message);
    }

    // Validar que la fecha no sea pasada
    // Ecuador está en UTC-5, ajustamos la comparación
    const eventDateTime = new Date(`${date}T${time || '00:00:00'}`);
    const now = new Date();

    // Ajustar por zona horaria de Ecuador (UTC-5 = -5 horas = -18000000 ms)
    const ecuadorOffset = 5 * 60 * 60 * 1000; // 5 horas en milisegundos
    const nowEcuador = new Date(now.getTime() - ecuadorOffset);

    if (eventDateTime < nowEcuador) {
      return sendValidationError(res, 'No se pueden crear eventos con fechas pasadas');
    }

    // Validar que el evento esté dentro del horario de la facultad
    const locationResult = await pool.query(
      "SELECT name, schedule FROM locations WHERE id = $1",
      [location_id]
    );

    if (locationResult.rows.length === 0) {
      return sendValidationError(res, 'Ubicación no encontrada');
    }

    const { name: locationName, schedule } = locationResult.rows[0];

    if (schedule && time) {
      // Parse schedule format: "07:00 - 20:00"
      const scheduleMatch = schedule.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);

      if (scheduleMatch) {
        const [, openTime, closeTime] = scheduleMatch;
        const [openH, openM] = openTime.split(':').map(Number);
        const [closeH, closeM] = closeTime.split(':').map(Number);
        const [eventH, eventM] = time.split(':').map(Number);

        const openMinutes = openH * 60 + openM;
        const closeMinutes = closeH * 60 + closeM;
        const eventMinutes = eventH * 60 + eventM;

        if (eventMinutes < openMinutes || eventMinutes > closeMinutes) {
          return sendValidationError(
            res,
            `El evento debe estar dentro del horario de ${locationName}: ${schedule}`
          );
        }

        // Also validate end_time if provided
        if (end_time) {
          const [endH, endM] = end_time.split(':').map(Number);
          const endMinutes = endH * 60 + endM;

          if (endMinutes > closeMinutes) {
            return sendValidationError(
              res,
              `El evento debe terminar antes del cierre de ${locationName} (${closeTime})`
            );
          }
        }
      }
    }


    // 1. Insertar evento
    const newEvent = await pool.query(
      "INSERT INTO events (title, description, date, time, end_time, location_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description, date, time, end_time || null, location_id]
    );
    const eventData = newEvent.rows[0];

    // 2. Invalidar caché
    await invalidateCache('all_events');

    // 3. Notificar Socket (Mapa en vivo)
    if (req.io) {
      req.io.emit('server:new_data', { type: 'EVENT_CREATED', data: eventData });
    }

    // 4. Enviar notificaciones por correo a TODOS los estudiantes
    console.log('📬 [EMAIL] Iniciando proceso de notificación de evento...');

    const locRes = await pool.query("SELECT name FROM locations WHERE id = $1", [location_id]);
    const locName = locRes.rows[0]?.name || "Campus UCE";

    const users = await pool.query(
      "SELECT email FROM users WHERE role = 'student' AND is_verified = TRUE"
    );
    const emailList = users.rows.map(u => u.email);

    console.log(`📬 [EMAIL] Encontrados ${emailList.length} estudiantes verificados`);

    if (emailList.length > 0) {
      console.log(`📧 Enviando notificación de evento a ${emailList.length} estudiantes...`);
      sendEventNotification(
        emailList,
        eventData.title,
        eventData.date.toString().split('T')[0],
        eventData.description,
        locName
      ).catch(err => console.error("❌ Error envío correos:", err));
    } else {
      console.log(`⚠️ No hay estudiantes verificados para notificar`);
    }

    sendSuccess(res, eventData);

  } catch (err) {
    sendError(res, err);
  }
};

// =================================================================
// 3. ACTUALIZAR EVENTO (PUT)
// =================================================================
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, end_time, location_id } = req.body;

    // 1. Validar existencia
    // Verificar que el evento existe
    const check = await pool.query("SELECT id FROM events WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return sendNotFound(res, 'Evento');
    }

    // Actualizar evento
    const result = await pool.query(
      "UPDATE events SET title=$1, description=$2, date=$3, time=$4, end_time=$5, location_id=$6 WHERE id=$7 RETURNING *",
      [title, description, date, time, end_time, parseInt(location_id), id]
    );

    // Invalidar caché y notificar
    await invalidateCache('all_events');
    if (req.io) {
      req.io.emit('server:data_updated', { type: 'EVENT_UPDATED', data: result.rows[0] });
    }

    sendSuccess(res, result.rows[0]);
  } catch (err) {
    sendError(res, err);
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM events WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return sendNotFound(res, 'Evento');
    }

    // Invalidar caché y notificar
    await invalidateCache('all_events');
    if (req.io) {
      req.io.emit('server:data_updated', { type: 'EVENT_DELETED', id: id });
    }

    sendSuccess(res, { message: "Evento eliminado" });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = {
  getEvents,
  getEventsByLocation,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};