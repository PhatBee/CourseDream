import jwt from 'jsonwebtoken';

/**
 * Tạo JWT Token
 * @param {string} userId - ID của người dùng từ MongoDB
 * @param {string} userRole - Vai trò của người dùng
 * @returns {string} - JWT Token
 */
export const generateToken = (userId, userRole) => {
  return jwt.sign(
    { 
      id: userId, 
      role: userRole 
    }, 
    process.env.JWT_SECRET, // Hãy thêm JWT_SECRET vào file .env của bạn
    {
      expiresIn: '1d', // Token hết hạn sau 1 ngày
    }
  );
};

export const resetToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
}