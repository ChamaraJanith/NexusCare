import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing or invalid format"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract doctorId from roleId ONLY if the user is actually a doctor
    const doctorId = decoded.role === "doctor" ? decoded.roleId : null;

    req.user = {
      id: decoded.userId, 
      role: decoded.role,
      roleId: decoded.roleId,
      doctorId: doctorId 
    };

    next();

  } catch (err) {
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