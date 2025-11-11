
import { authApi } from "../../api/authApi";
/**
 * Gọi API đăng nhập
 * @param {object} userData - { email, password }
 * @returns {Promise<object>} - Dữ liệu trả về từ API (token, user)
 */
const login = async (userData) => {
  const response = await authApi.login(userData);

  // Nếu đăng nhập thành công, lưu token và user vào localStorage
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', JSON.stringify(response.data.token));
  }

  return response.data;
};

/**
 * Đăng xuất
 */
const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

/**
 * Gọi API đăng ký
 * @param {object} userData - { name, email, password }
 * @returns {Promise<object>} - Dữ liệu trả về từ API
 */
const register = async (userData) => {
  const response = await authApi.register(userData);
  // KHÔNG lưu vào localStorage, chỉ trả về response
  return response.data;
};

/**
 * Gọi API xác thực OTP
 * @param {object} otpData - { email, otp }
 * @returns {Promise<object>} - Dữ liệu trả về từ API
 */
const verifyOTP = async (otpData) => {
  const response = await authApi.verifyOTP(otpData);
  return response.data;
};

/**
 * Gọi API đăng nhập Google
 * @param {string} credential - id_token từ Google
 * @returns {Promise<object>} - Dữ liệu trả về từ API (token, user)
 */
const googleLogin = async (credential) => {
  const response = await authApi.googleLogin(credential);

  // Nếu đăng nhập thành công, lưu token và user vào localStorage
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', JSON.stringify(response.data.token));
  }

  return response.data;
};

/**
 * Gọi API đăng nhập Facebook
 * @param {string} accessToken - accessToken từ Facebook
 * @returns {Promise<object>} - Dữ liệu trả về từ API (token, user)
 */
const facebookLogin = async (accessToken) => {
  const response = await authApi.facebookLogin(accessToken);

  // Nếu đăng nhập thành công, lưu token và user vào localStorage
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', JSON.stringify(response.data.token));
  }

  return response.data;
};

const authService = {
  login,
  logout,
  register,
  verifyOTP,
  googleLogin,
  facebookLogin,
};

export default authService;