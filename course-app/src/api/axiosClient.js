import axios from "axios";
import { API_URL } from "../utils/config";
import { getToken } from "../utils/storage";

const axiosClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    // withCredentials: true, // Trên mobile Expo Go thường ít dùng cookie session kiểu này, nhưng cứ để nếu cần
});

// Interceptor: Gắn Token vào Header cho mọi request
axiosClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Xử lý lỗi chung (VD: show Toast)
        // Nếu 401: Xử lý logout hoặc refresh token (logic tương tự web nhưng dùng SecureStore)
        return Promise.reject(error);
    }
);

export default axiosClient;