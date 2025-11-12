// middlewares/role.middleware.js

export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Nếu chưa có user (chưa qua auth middleware)
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Kiểm tra role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions.",
        });
      }

      // Được phép → tiếp tục
      next();
    } catch (error) {
      console.error("Role middleware error:", error.message);
      res.status(500).json({ message: "Server error during role verification" });
    }
  };
};
