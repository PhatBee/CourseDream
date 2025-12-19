// Thay đổi IP này thành IP LAN của máy bạn (xem bằng ipconfig/ifconfig)
// Không dùng localhost vì localhost trên điện thoại là chính nó.
// Lấy trong .env
export const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID; // Lấy từ Google Cloud Console (loại Web Client ID hoạt động tốt với Expo Go Proxy)
export const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
export const EXPO_CLIENT_ID = process.env.EXPO_PUBLIC_EXPO_CLIENT_ID;