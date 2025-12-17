import axios from "axios";
import { API_URL } from "../utils/config";
import { getToken, saveToken, removeToken, removeUser } from "../utils/storage";
import { store } from "../app/store";
import { logout } from "../features/auth/authSlice";

const axiosClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor: Gắn Token vào Header cho mọi request
axiosClient.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor để xử lý 401 và refresh token
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip auto-refresh for auth endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/auth/');

        // If error is 401 and we haven't retried yet and NOT an auth endpoint
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            !isAuthEndpoint
        ) {
            originalRequest._retry = true;

            try {
                // Get current token
                const currentToken = await getToken();

                if (!currentToken) {
                    // No token, logout
                    throw new Error('No token available');
                }

                // Call refresh token API
                const response = await axios.post(
                    `${API_URL}/auth/refresh-token`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${currentToken}`,
                        },
                    }
                );

                // Save new access token
                const newAccessToken = response.data.accessToken;
                await saveToken(newAccessToken);

                // Update the failed request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the original request
                return axiosClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, logout user
                console.error('Refresh token failed:', refreshError);

                // Clear storage
                await removeToken();
                await removeUser();

                // Dispatch logout action
                store.dispatch(logout());

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;