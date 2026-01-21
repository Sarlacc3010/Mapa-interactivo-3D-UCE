const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // BUSCAMOS EL TOKEN EN LAS COOKIES
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ error: "Acceso denegado: No hay sesión activa" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Agregamos los datos del usuario a la request
    next(); // Continuamos
  } catch (error) {
    res.status(400).json({ error: "Token inválido o expirado" });
  }
};

module.exports = verifyToken;