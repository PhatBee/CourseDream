// auth.middleware.js
import User from "../modules/auth/auth.model.js";
import { verifyToken as verifyJWT } from "../utils/jwt.utils.js";

export const verifyToken = async (req, res, next) => {
  try {
    // 1 Lấy token từ header
    const authHeader = req.headers.authorization;
    console.log("🚀 Auth Header:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied, no token provided" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 Token nhận được:", token);


    // Xác minh token
    const decoded = verifyJWT(token);
    console.log("📌 decoded token:", decoded);


    // Tìm user trong DB
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Gắn user vào request để route có thể dùng
    req.user = user;

    // Cho phép đi tiếp
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
