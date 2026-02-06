const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { getImageUrl } = require('../utils/storageUtils');
const { withCache, invalidateCache } = require('../utils/cacheUtils');
const { sendSuccess, sendError, sendNotFound, sendCreated, sendDeleted } = require('../utils/responseUtils');
const { validateRequiredFields } = require('../utils/validationUtils');

const CACHE_KEY = 'locations:all';

// =================================================================
// 1. GET LOCATIONS (WITH CACHE)
// =================================================================
const getLocations = async (req, res) => {
    try {
        const locations = await withCache(CACHE_KEY, async () => {
            console.log('[DB READ] Querying PostgreSQL...');
            const result = await pool.query("SELECT * FROM locations ORDER BY id ASC");

            // Transform image URLs
            return result.rows.map(loc => ({
                ...loc,
                image_url: getImageUrl(loc.image_url)
            }));
        }, 3600);

        sendSuccess(res, locations);
    } catch (err) {
        sendError(res, err);
    }
};

// =================================================================
// 2. REGISTER VISIT (PUBLIC / MIXED)
// =================================================================
const registerVisit = async (req, res) => {
    try {
        const { id } = req.params;
        let userEmail = 'anonimo@visitante.com';

        // Try to get email from token if exists
        const token = req.cookies.access_token ||
            (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userEmail = decoded.email;
            } catch (e) {
                console.log("Invalid token in visit, registering as anonymous.");
            }
        }

        await pool.query(
            "INSERT INTO visits (location_id, visitor_email) VALUES ($1, $2)",
            [id, userEmail]
        );

        // Notify via WebSocket
        if (req.io) {
            console.log('[WEBSOCKET] Emitting event server:visit_registered for location_id:', id);
            req.io.emit('server:visit_registered', {
                location_id: id,
                timestamp: new Date()
            });
            console.log('[WEBSOCKET] Event emitted successfully');
        } else {
            console.warn('[WEBSOCKET] req.io is not available, cannot emit event');
        }

        sendSuccess(res, { message: "Visita registrada correctamente" });
    } catch (err) {
        sendError(res, err);
    }
};

// =================================================================
// 3. CREATE LOCATION (ADMIN)
// =================================================================
const createLocation = async (req, res) => {
    try {
        const { name, description, category, coordinates, object3d_id, faculty_id, image_url } = req.body;

        // Validate required fields
        const validation = validateRequiredFields(req.body, ['name', 'coordinates']);
        if (!validation.isValid) {
            return sendError(res, validation.message, 400);
        }

        const newLocation = await pool.query(
            "INSERT INTO locations (name, description, category, coordinates, object3d_id, faculty_id, image_url) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [name, description, category, JSON.stringify(coordinates), object3d_id, faculty_id, image_url]
        );

        // Invalidate cache
        await invalidateCache(CACHE_KEY);

        sendCreated(res, newLocation.rows[0]);
    } catch (err) {
        sendError(res, err);
    }
};

// =================================================================
// 4. EDIT LOCATION (ADMIN)
// =================================================================
const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, coordinates, object3d_id, image_url } = req.body;

        const updateLocation = await pool.query(
            "UPDATE locations SET name = $1, description = $2, category = $3, coordinates = $4, object3d_id = $5, image_url = $6 WHERE id = $7 RETURNING *",
            [name, description, category, JSON.stringify(coordinates), object3d_id, image_url, id]
        );

        if (updateLocation.rows.length === 0) {
            return sendNotFound(res, 'Ubicación');
        }

        // Invalidate cache
        await invalidateCache(CACHE_KEY);

        sendSuccess(res, updateLocation.rows[0]);
    } catch (err) {
        sendError(res, err);
    }
};

// =================================================================
// 5. DELETE LOCATION (ADMIN)
// =================================================================
const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM locations WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return sendNotFound(res, 'Ubicación');
        }

        // Invalidate cache
        await invalidateCache(CACHE_KEY);

        sendDeleted(res, "Ubicación eliminada");
    } catch (err) {
        sendError(res, err);
    }
};

module.exports = {
    getLocations,
    registerVisit,
    createLocation,
    updateLocation,
    deleteLocation
};
