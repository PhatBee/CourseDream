import { authApi } from "../../api/authApi";
import { userApi } from "../../api/userApi";

/**
 * Gọi API đăng nhập
 * @param {object} userData - { email, password }
 * @returns {Promise<object>} - Dữ liệu trả về từ API (token, user)
 */
const login = async (userData) => {
  const response = await authApi.login(userData);

  // Nếu đăng nhập thành công, lưu user vào localStorage (không lưu token)
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return response.data;
};

/**
 * Đăng xuất
 */
const logout = async () => {
  try {
    await authApi.logout(); // Gọi API logout để xóa cookie
  } catch (error) {
    console.error("Logout error:", error);
  }
  localStorage.removeItem('user');
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

  // Nếu đăng nhập thành công, lưu user vào localStorage
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
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

  // Nếu đăng nhập thành công, lưu user vào localStorage
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return response.data;
};

/**
 * Gọi API Quên mật khẩu
 */
const forgotPassword = async (email) => {
  const response = await authApi.forgotPassword(email);
  return response.data;
};

/**
 * Gọi API Xác thực OTP reset
 */
const verifyResetOTP = async (otpData) => {
  const response = await authApi.verifyResetOTP(otpData);
  return response.data; // Sẽ chứa resetToken
};

/**
 * Gọi API Đặt mật khẩu mới
 */
const setPassword = async (passwordData) => {
  const response = await authApi.setPassword(passwordData);
  return response.data;
};

const updateUserInStorage = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
};

const updateProfile = async (profileData) => {
  const response = await userApi.updateProfile(profileData);
  if (response.data.data) {
    updateUserInStorage(response.data.data);
  }
  return response.data;
};

const changePassword = async (passwordData) => {
  const response = await userApi.changePassword(passwordData);
  return response.data;
};

const authService = {
  login,
  logout,
  register,
  verifyOTP,
  googleLogin,
  facebookLogin,
  forgotPassword,
  verifyResetOTP,
  setPassword,
  updateProfile,
  changePassword,
  updateUserInStorage,
};

export default authService;