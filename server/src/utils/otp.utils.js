/**
 * Tạo mã OTP 6 chữ số
 * @returns {string} Mã OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};