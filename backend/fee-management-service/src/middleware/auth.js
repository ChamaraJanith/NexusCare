const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided." });
    }
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access only." });
  }
  next();
};

// Internal service-to-service calls OR admin JWT
const internalOrAdmin = (req, res, next) => {
  const key = req.headers["x-internal-service-key"];
  if (key && key === process.env.INTERNAL_SERVICE_KEY) return next();
  protect(req, res, () => adminOnly(req, res, next));
};

module.exports = { protect, adminOnly, internalOrAdmin };