import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Enable sending cookies
});

// Request interceptor (Optional: if you still want to attach token manually, but with cookies it's not needed for the main token)
// However, if you have other headers, keep them here.
axiosClient.interceptors.request.use((config) => {
  // const token = localStorage.getItem("accessToken"); // No longer using localStorage for token
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

// Response interceptor to handle 401 and refresh token
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Danh sách các endpoint KHÔNG cần refresh (public endpoints)
    const publicAuthEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/verify-otp',
      '/auth/google',
      '/auth/facebook',
      '/auth/forgot-password',
      '/auth/verify-reset-otp',
      '/auth/set-password'
    ];

    // Kiểm tra xem có phải public endpoint không
    const isPublicEndpoint = publicAuthEndpoints.some(endpoint =>
      originalRequest.url?.includes(endpoint)
    );

    // Kiểm tra xem có phải refresh-token endpoint không (tránh infinite loop)
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh-token');

    // Nếu lỗi 401, chưa retry, không phải public endpoint, và không phải refresh endpoint
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicEndpoint &&
      !isRefreshEndpoint
    ) {
      originalRequest._retry = true;

      try {
        console.log('🔄 Token expired, attempting to refresh...');

        // Gọi API refresh token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        console.log('✅ Token refreshed successfully');

        // Retry request ban đầu
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Nếu refresh thất bại (refresh token hết hạn hoặc không hợp lệ)
        console.error('❌ Refresh token failed:', refreshError.response?.data || refreshError.message);

        // Clear user data và redirect về login
        localStorage.removeItem('user');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
