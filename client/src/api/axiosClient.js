import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // thay bằng URL backend
  withCredentials: false, // nếu backend dùng cookie
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  console.log("🟦 FE gửi token:", token);
  console.log("🟥 Header FE gửi:", config.headers);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
