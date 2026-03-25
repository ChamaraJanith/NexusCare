import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1️⃣ Check header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing"
      });
    }

    // 2️⃣ Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format (Bearer required)"
      });
    }

    const token = authHeader.split(" ")[1];

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 Attach full user info
    req.user = {
      id: decoded.id,
      role: decoded.role,
      doctorId: decoded.doctorId || null // 🔥 support doctorId
    };

    next();

  } catch (err) {
    // 🔥 Better error handling
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired"
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid token"
    });
  }
};