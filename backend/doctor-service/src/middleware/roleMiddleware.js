export const allowRoles = (...roles) => {
  return (req, res, next) => {
    try {
      // 1️⃣ Check user exists (verifyToken ran?)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized (no user found)"
        });
      }

      // 2️⃣ Check role exists
      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: "User role not defined"
        });
      }

      // 3️⃣ Normalize roles (safety)
      const userRole = req.user.role.toLowerCase();
      const allowedRoles = roles.map(r => r.toLowerCase());

      // 4️⃣ Check access
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied for role: ${req.user.role}`
        });
      }

      next();

    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Role authorization error"
      });
    }
  };
};