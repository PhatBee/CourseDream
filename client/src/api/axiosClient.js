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

    // Skip auto-refresh for auth endpoints (login, register, etc.)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    // If error is 401 and we haven't retried yet and NOT an auth endpoint
    if (error.response && error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Call refresh token API
        // Note: We use a new axios instance to avoid infinite loops if this request also fails
        await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        // If successful, retry the original request
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails (e.g., refresh token expired), logout user
        console.error("Refresh token failed:", refreshError);
        localStorage.removeItem("user");
        window.location.href = "/login"; // Redirect to login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
