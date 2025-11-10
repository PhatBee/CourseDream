import bcrypt from 'bcryptjs';

/**
 * Băm mật khẩu
 * @param {string} password - Mật khẩu thô
 * @returns {Promise<string>} - Mật khẩu đã băm
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * So sánh mật khẩu
 * @param {string} candidatePassword - Mật khẩu người dùng nhập
 * @param {string} hashedPassword - Mật khẩu đã băm trong DB
 * @returns {Promise<boolean>} - True nếu khớp, false nếu không
 */
export const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};