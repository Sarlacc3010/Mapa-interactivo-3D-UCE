const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // 1. Intentamos leer el token de la cookie
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ error: "Acceso denegado: No has iniciado sesión" });
  }

  try {
    // 2. Verificamos el token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Guardamos los datos del usuario en la request para usarlos luego
    req.user = verified;
    
    next(); // Continuar a la siguiente función
  } catch (error) {
    res.status(400).json({ error: "Token inválido o expirado" });
  }
};

module.exports = verifyToken;