
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

// (Bạn có thể thêm hàm register ở đây nếu muốn)

const authService = {
  login,
  logout,
};

export default authService;