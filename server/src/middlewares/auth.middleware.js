// auth.middleware.js
import User from "../modules/auth/auth.model.js";
import { verifyToken as verifyJWT } from "../utils/jwt.utils.js";

export const verifyToken = async (req, res, next) => {
  try {
    // 1. Lấy token từ cookie hoặc header
    let token = req.cookies.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        message: "Access denied, no token provided",
        code: "NO_TOKEN"
      });
    }

    // 2. Xác minh token
    const decoded = verifyJWT(token);

    // 3. Tìm user trong DB
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // 4. Gắn user vào request để route có thể dùng
    req.user = user;

    // 5. Cho phép đi tiếp
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);

    // Phân biệt loại lỗi
    if (err.name === 'TokenExpiredError') {
      // Token hết hạn - client nên refresh
      return res.status(401).json({
        message: "Access token expired",
        code: "TOKEN_EXPIRED"
      });
    } else if (err.name === 'JsonWebTokenError') {
      // Token không hợp lệ
      return res.status(401).json({
        message: "Invalid token",
        code: "INVALID_TOKEN"
      });
    } else {
      // Lỗi khác
      return res.status(401).json({
        message: "Authentication failed",
        code: "AUTH_FAILED"
      });
    }
  }
};
