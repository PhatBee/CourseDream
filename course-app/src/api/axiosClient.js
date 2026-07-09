import axios from "axios";
import { API_URL } from "../utils/config";
import { getToken, saveToken, removeToken, removeUser, getRefreshToken, saveRefreshToken, removeRefreshToken } from "../utils/storage";
import { getStore } from "../app/storeHolder";
import * as RootNavigation from "../utils/navigation";
import Toast from 'react-native-toast-message';

const axiosClient = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10 giây — fail fast khi ngrok hết hạn hoặc server down
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
        if (__DEV__) {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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

                // Get refresh token
                const refreshToken = await getRefreshToken();

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Call refresh token API by passing refreshToken in the request body
                const response = await axios.post(
                    `${API_URL}/auth/refresh-token`,
                    { refreshToken }
                );

                console.log('✅ Token refreshed successfully');

                // Save new access token & refresh token
                const newAccessToken = response.data.accessToken;
                const newRefreshToken = response.data.refreshToken;

                await saveToken(newAccessToken);
                if (newRefreshToken) {
                    await saveRefreshToken(newRefreshToken);
                }

                // Update the failed request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the original request
                return axiosClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, logout user
                console.error('❌ Refresh token failed:', refreshError.response?.data || refreshError.message);

                // Show Toast message
                Toast.show({
                    type: 'error',
                    text1: 'Phiên đăng nhập đã hết hạn',
                    text2: 'Vui lòng đăng nhập lại.',
                    position: 'bottom',
                });

                // Clear storage
                await removeToken();
                await removeUser();
                await removeRefreshToken();

                // Dispatch logout action (dùng getStore() từ storeHolder — không có require cycle)
                const store = getStore();
                store?.dispatch({ type: 'auth/logout/fulfilled' });
                // Clear các slice liên quan
                store?.dispatch({ type: 'wishlist/clearWishlistState' });
                store?.dispatch({ type: 'cart/resetCart' });
                store?.dispatch({ type: 'enrollment/resetEnrollment' });

                // Redirect to Login Screen
                RootNavigation.navigate('Login');

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;