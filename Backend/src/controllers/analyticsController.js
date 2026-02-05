const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseUtils');

// Queries como constantes para mejor mantenibilidad
const QUERIES = {
  TOTAL_VISITS: "SELECT COUNT(*) FROM visits",
  TOTAL_USERS: "SELECT COUNT(*) FROM users",
  TOTAL_EVENTS: "SELECT COUNT(*) FROM events",
  TOP_LOCATIONS: `
    SELECT l.name, COUNT(v.id) as visits 
    FROM visits v 
    JOIN locations l ON v.location_id = l.id 
    GROUP BY l.name 
    ORDER BY visits DESC 
    LIMIT 5
  `,
  PEAK_HOURS: `
    SELECT EXTRACT(HOUR FROM visit_date) as hour, COUNT(*) as count 
    FROM visits 
    WHERE visit_date >= CURRENT_DATE 
    GROUP BY hour 
    ORDER BY hour ASC
  `
};

// Helper para ejecutar queries de analytics
async function executeAnalyticsQuery(query, errorMessage) {
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    console.error(errorMessage, err);
    throw new Error(errorMessage);
  }
}

// 1. Resumen General (Tarjetas de arriba)
const getSummary = async (req, res) => {
  try {
    const [visitsRes, usersRes, eventsRes] = await Promise.all([
      pool.query(QUERIES.TOTAL_VISITS),
      pool.query(QUERIES.TOTAL_USERS),
      pool.query(QUERIES.TOTAL_EVENTS)
    ]);

    sendSuccess(res, {
      totalVisits: parseInt(visitsRes.rows[0].count),
      totalUsers: parseInt(usersRes.rows[0].count),
      totalEvents: parseInt(eventsRes.rows[0].count)
    });
  } catch (err) {
    sendError(res, "Error obteniendo resumen");
  }
};

// 2. Lugares Más Visitados (Gráfica de Barras)
const getTopLocations = async (req, res) => {
  try {
    const result = await executeAnalyticsQuery(
      QUERIES.TOP_LOCATIONS,
      "Error obteniendo top lugares"
    );
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err);
  }
};

// 3. Horas Pico (Gráfica de Área)
const getPeakHours = async (req, res) => {
  try {
    const result = await executeAnalyticsQuery(
      QUERIES.PEAK_HOURS,
      "Error obteniendo horas pico"
    );

    // Rellenar las horas vacías (00:00 a 23:00) con 0
    const fullDayStats = Array.from({ length: 24 }, (_, i) => {
      const found = result.find(r => parseInt(r.hour) === i);
      return {
        name: `${i}:00`,
        visitas: found ? parseInt(found.count) : 0
      };
    });

    sendSuccess(res, fullDayStats);
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = { getSummary, getTopLocations, getPeakHours };
