import jwt from 'jsonwebtoken';

/**
 * Tạo Access Token (ngắn hạn)
 * @param {string} userId
 * @param {string} userRole
 * @returns {string}
 */
export const generateAccessToken = (userId, userRole) => {
  return jwt.sign(
    { id: userId, role: userRole },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 15 phút
  );
};

/**
 * Tạo Refresh Token (dài hạn)
 * @param {string} userId
 * @returns {string}
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 ngày
  );
};

/**
 * Xác thực Access Token
 * @param {string} token
 * @returns {object}
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Xác thực Refresh Token
 * @param {string} token
 * @returns {object}
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
};

export const resetToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
};

// Giữ lại để tương thích ngược nếu cần, hoặc xóa đi và sửa code gọi nó
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;