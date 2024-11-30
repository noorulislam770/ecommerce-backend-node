const jwt = require("jsonwebtoken");

// Middleware to verify JWT and attach user to the request
const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info (id, role) to the request
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};

// Middleware to authorize based on role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Unauthorized role." });
    }
    next();
  };
};

module.exports = { authenticateJWT, authorizeRoles };
