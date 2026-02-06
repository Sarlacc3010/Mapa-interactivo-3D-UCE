const pool = require('../config/db');
const { sendEventNotification } = require('../services/mailService');
// Shared utilities
const { withCache, invalidateCache } = require('../utils/cacheUtils');
const { sendSuccess, sendError, sendNotFound, sendValidationError } = require('../utils/responseUtils');
const { validateRequiredFields } = require('../utils/validationUtils');

// =================================================================
// HELPER: VALIDATE PAST DATES
// =================================================================
const isPastDate = (dateStr, timeStr) => {
  // Combine date and time (or 00:00) to compare
  const eventDate = new Date(`${dateStr}T${timeStr || '00:00:00'}`);
  const now = new Date();
  // Returns true if event date is before now
  return eventDate < now;
};

// =================================================================
// 1. READ (GET)
// =================================================================
const getEvents = async (req, res) => {
  try {
    // Use automatic cache wrapper
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

    // Query filtering finished events
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
// 2. CREATE EVENT (POST)
// =================================================================
const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, end_time, location_id } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, ['title', 'date', 'location_id']);
    if (!validation.isValid) {
      return sendValidationError(res, validation.message);
    }

    // Validate date is not in the past. Ecuador is UTC-5.
    const eventDateTime = new Date(`${date}T${time || '00:00:00'}`);
    const now = new Date();

    // Adjust for Ecuador timezone (UTC-5)
    const ecuadorOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
    const nowEcuador = new Date(now.getTime() - ecuadorOffset);

    if (eventDateTime < nowEcuador) {
      return sendValidationError(res, 'No se pueden crear eventos con fechas pasadas');
    }

    // Validate event is within faculty schedule
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


    // 1. Insert event
    const newEvent = await pool.query(
      "INSERT INTO events (title, description, date, time, end_time, location_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description, date, time, end_time || null, location_id]
    );
    const eventData = newEvent.rows[0];

    // 2. Invalidate cache
    await invalidateCache('all_events');

    // 3. Notify Socket (Live Map)
    if (req.io) {
      req.io.emit('server:new_data', { type: 'EVENT_CREATED', data: eventData });
    }

    // 4. Send email notifications to ALL students
    console.log('[EMAIL] Notification process started...');

    const locRes = await pool.query("SELECT name FROM locations WHERE id = $1", [location_id]);
    const locName = locRes.rows[0]?.name || "Campus UCE";

    const users = await pool.query(
      "SELECT email FROM users WHERE role = 'student' AND is_verified = TRUE"
    );
    const emailList = users.rows.map(u => u.email);

    console.log(`[EMAIL] Found ${emailList.length} verified students`);

    if (emailList.length > 0) {
      console.log(`Sending event notification to ${emailList.length} students...`);
      sendEventNotification(
        emailList,
        eventData.title,
        eventData.date.toString().split('T')[0],
        eventData.description,
        locName
      ).catch(err => console.error("Error sending emails:", err));
    } else {
      console.log(`No verified students to notify`);
    }

    sendSuccess(res, eventData);

  } catch (err) {
    sendError(res, err);
  }
};

// =================================================================
// 3. UPDATE EVENT (PUT)
// =================================================================
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, end_time, location_id } = req.body;

    // 1. Validate existence
    // Verify event exists
    const check = await pool.query("SELECT id FROM events WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return sendNotFound(res, 'Evento');
    }

    // Update event
    const result = await pool.query(
      "UPDATE events SET title=$1, description=$2, date=$3, time=$4, end_time=$5, location_id=$6 WHERE id=$7 RETURNING *",
      [title, description, date, time, end_time, parseInt(location_id), id]
    );

    // Invalidate cache and notify
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

    // Invalidate cache and notify
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