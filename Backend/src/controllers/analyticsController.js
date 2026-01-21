// Backend/src/controllers/analyticsController.js
const pool = require('../config/db');

// 1. Resumen General (Tarjetas de arriba)
const getSummary = async (req, res) => {
  try {
    // Contar total de visitas
    const visitsRes = await pool.query("SELECT COUNT(*) FROM visits");
    // Contar total de usuarios
    const usersRes = await pool.query("SELECT COUNT(*) FROM users");
    // Contar total de eventos
    const eventsRes = await pool.query("SELECT COUNT(*) FROM events");

    res.json({
      totalVisits: parseInt(visitsRes.rows[0].count),
      totalUsers: parseInt(usersRes.rows[0].count),
      totalEvents: parseInt(eventsRes.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo resumen" });
  }
};

// 2. Lugares Más Visitados (Gráfica de Barras)
const getTopLocations = async (req, res) => {
  try {
    const query = `
      SELECT l.name, COUNT(v.id) as visits 
      FROM visits v 
      JOIN locations l ON v.location_id = l.id 
      GROUP BY l.name 
      ORDER BY visits DESC 
      LIMIT 5
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo top lugares" });
  }
};

// 3. Horas Pico (Gráfica de Área)
const getPeakHours = async (req, res) => {
  try {
    // Agrupa visitas por hora del día actual
    const query = `
        SELECT EXTRACT(HOUR FROM visit_date) as hour, COUNT(*) as count 
        FROM visits 
        WHERE visit_date >= CURRENT_DATE 
        GROUP BY hour 
        ORDER BY hour ASC
    `;
    const result = await pool.query(query);
    
    // Rellenar las horas vacías (00:00 a 23:00) con 0
    const fullDayStats = Array.from({ length: 24 }, (_, i) => {
        const found = result.rows.find(r => parseInt(r.hour) === i);
        return {
            name: `${i}:00`,
            visitas: found ? parseInt(found.count) : 0
        };
    });

    res.json(fullDayStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo horas pico" });
  }
};

module.exports = { getSummary, getTopLocations, getPeakHours };