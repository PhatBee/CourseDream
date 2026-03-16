import axios from "axios";
import { API_URL } from "../utils/config";
import { getToken, saveToken, removeToken, removeUser } from "../utils/storage";
import { store } from "../app/store";

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

                console.log('✅ Token refreshed successfully');

                // Save new access token
                const newAccessToken = response.data.accessToken;
                await saveToken(newAccessToken);

                // Update the failed request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the original request
                return axiosClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, logout user
                console.error('❌ Refresh token failed:', refreshError.response?.data || refreshError.message);

                // Clear storage
                await removeToken();
                await removeUser();

                // Dispatch logout action (dùng action type string để tránh require cycle)
                store.dispatch({ type: 'auth/logout/fulfilled' });
                // Clear các slice liên quan
                store.dispatch({ type: 'wishlist/clearWishlistState' });
                store.dispatch({ type: 'cart/resetCart' });
                store.dispatch({ type: 'enrollment/resetEnrollment' });

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;