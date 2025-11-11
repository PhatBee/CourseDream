
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

const authService = {
  login,
  logout,
  register,
};

export default authService;