const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // FIND TOKEN IN COOKIES
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ error: "Access denied: No active session" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Add user data to request
    next(); // Continue
  } catch (error) {
    res.status(400).json({ error: "Invalid or expired token" });
  }
};

module.exports = verifyToken;