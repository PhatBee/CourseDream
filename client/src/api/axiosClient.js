import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Enable sending cookies
});

// Request interceptor
axiosClient.interceptors.request.use((config) => {
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

    // Danh sách các endpoint public (guest có thể truy cập)
    const publicEndpoints = [
      '/courses',
      '/categories',
      '/search',
      '/instructors',
      '/stats'
    ];

    // Kiểm tra xem có phải public endpoint không
    const isPublicAuthEndpoint = publicAuthEndpoints.some(endpoint =>
      originalRequest.url?.includes(endpoint)
    );

    // Kiểm tra xem có phải public data endpoint không
    const isPublicDataEndpoint = publicEndpoints.some(endpoint =>
      originalRequest.url?.includes(endpoint)
    );

    // Kiểm tra xem có phải refresh-token endpoint không (tránh infinite loop)
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh-token');

    // Nếu lỗi 401
    if (error.response?.status === 401) {
      // Nếu là public data endpoint -> Không cần xử lý, trả về lỗi bình thường
      if (isPublicDataEndpoint) {
        return Promise.reject(error);
      }

      // Nếu chưa retry, không phải public auth endpoint, và không phải refresh endpoint
      if (
        !originalRequest._retry &&
        !isPublicAuthEndpoint &&
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

          // Chỉ clear và redirect nếu user đã từng login (có user trong localStorage)
          const hasUser = localStorage.getItem('user');
          if (hasUser) {
            localStorage.removeItem('user');
            // Chỉ redirect nếu không phải trang public
            if (!window.location.pathname.includes('/courses') &&
              !window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }

          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
