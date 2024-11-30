const jwt = require("jsonwebtoken");

// Middleware to verify JWT and attach user to the request
const authenticateJWT = (req, res, next) => {
  const token =
    req.cookies?.token || req.header("Authorization")?.split(" ")[1];

  if (!token) {
    req.user = null; // No user if no token
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to req.user
    next();
  } catch (error) {
    req.user = null; // Invalid token
    next();
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
