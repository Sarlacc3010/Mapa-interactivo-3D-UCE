const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { getImageUrl } = require('../utils/storageUtils');
const { withCache, invalidateCache } = require('../utils/cacheUtils');
const { sendSuccess, sendError, sendNotFound, sendCreated, sendDeleted } = require('../utils/responseUtils');
const { validateRequiredFields } = require('../utils/validationUtils');

const CACHE_KEY = 'locations:all';

// =================================================================
// 1. OBTENER UBICACIONES (CON CACHÉ)
// =================================================================
const getLocations = async (req, res) => {
    try {
        const locations = await withCache(CACHE_KEY, async () => {
            console.log('🐢 [DB READ] Consultando PostgreSQL...');
            const result = await pool.query("SELECT * FROM locations ORDER BY id ASC");

            // Transformar URLs de imágenes
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
// 2. REGISTRAR VISITA (PÚBLICO / MIXTO)
// =================================================================
const registerVisit = async (req, res) => {
    try {
        const { id } = req.params;
        let userEmail = 'anonimo@visitante.com';

        // Intentar obtener email del token si existe
        const token = req.cookies.access_token ||
            (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userEmail = decoded.email;
            } catch (e) {
                console.log("Token inválido en visita, registrando como anónimo.");
            }
        }

        await pool.query(
            "INSERT INTO visits (location_id, visitor_email) VALUES ($1, $2)",
            [id, userEmail]
        );

        // Notificar vía WebSocket
        if (req.io) {
            console.log('🔥 [WEBSOCKET] Emitiendo evento server:visit_registered para location_id:', id);
            req.io.emit('server:visit_registered', {
                location_id: id,
                timestamp: new Date()
            });
            console.log('✅ [WEBSOCKET] Evento emitido correctamente');
        } else {
            console.warn('⚠️ [WEBSOCKET] req.io no está disponible, no se puede emitir evento');
        }

        sendSuccess(res, { message: "Visita registrada correctamente" });
    } catch (err) {
        sendError(res, err);
    }
};

// =================================================================
// 3. CREAR UBICACIÓN (ADMIN)
// =================================================================
const createLocation = async (req, res) => {
    try {
        const { name, description, category, coordinates, object3d_id, faculty_id, image_url } = req.body;

        // Validar campos requeridos
        const validation = validateRequiredFields(req.body, ['name', 'coordinates']);
        if (!validation.isValid) {
            return sendError(res, validation.message, 400);
        }

        const newLocation = await pool.query(
            "INSERT INTO locations (name, description, category, coordinates, object3d_id, faculty_id, image_url) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [name, description, category, JSON.stringify(coordinates), object3d_id, faculty_id, image_url]
        );

        // Invalidar caché
        await invalidateCache(CACHE_KEY);

        sendCreated(res, newLocation.rows[0]);
    } catch (err) {
        sendError(res, err);
    }
};

// =================================================================
// 4. EDITAR UBICACIÓN (ADMIN)
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

        // Invalidar caché
        await invalidateCache(CACHE_KEY);

        sendSuccess(res, updateLocation.rows[0]);
    } catch (err) {
        sendError(res, err);
    }
};

// =================================================================
// 5. ELIMINAR UBICACIÓN (ADMIN)
// =================================================================
const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM locations WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return sendNotFound(res, 'Ubicación');
        }

        // Invalidar caché
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
