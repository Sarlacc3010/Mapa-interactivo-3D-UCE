const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'uce_secreto_super_seguro';

const verifyToken = (req, res, next) => {
  // 1. Buscar el token en el encabezado (Header)
  const authHeader = req.headers['authorization'];
  
  // El formato suele ser: "Bearer eyJhbGciOi..."
  // Así que separamos la palabra "Bearer" del token real
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: "Acceso denegado: Se requiere un token" });
  }

  // 2. Verificar si el token es real y no ha expirado
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido o expirado" });
    }
    
    // 3. Si todo está bien, guardamos los datos del usuario en la petición
    req.user = user;
    next(); // Dejamos pasar a la siguiente función (la ruta real)
  });
};

module.exports = verifyToken;