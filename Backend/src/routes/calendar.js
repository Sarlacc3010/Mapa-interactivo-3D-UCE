const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');

console.log("[CALENDAR] Loading routes...");

// 1. SUBSCRIBE/UNSUBSCRIBE (Toggle)
router.post('/toggle', authMiddleware, async (req, res) => {
  const { event_id } = req.body;
  const user_id = req.user.id;
  try {
    const check = await pool.query("SELECT id FROM event_subscriptions WHERE user_id = $1 AND event_id = $2", [user_id, event_id]);
    if (check.rows.length > 0) {
      await pool.query("DELETE FROM event_subscriptions WHERE user_id = $1 AND event_id = $2", [user_id, event_id]);
      return res.json({ saved: false, message: "Eliminado" });
    } else {
      await pool.query("INSERT INTO event_subscriptions (user_id, event_id) VALUES ($1, $2)", [user_id, event_id]);
      return res.json({ saved: true, message: "Guardado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// 2. GET IDs (For button states)
router.get('/my-subscriptions', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT event_id FROM event_subscriptions WHERE user_id = $1", [req.user.id]);
    res.json(result.rows.map(row => row.event_id));
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// 3. GET DETAILS (For Modal)
router.get('/my-events', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.title, e.date, e.time, e.description, l.name as location_name
      FROM event_subscriptions es
      JOIN events e ON es.event_id = e.id
      JOIN locations l ON e.location_id = l.id
      WHERE es.user_id = $1
      ORDER BY e.date ASC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;