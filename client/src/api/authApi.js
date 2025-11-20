import axiosClient from "./axiosClient";

const path = "/auth"


const login = async (userData) => {
  return axiosClient.post(`${path}/login`, userData);
};

const register = (userData) => {
  return axiosClient.post(`${path}/register`, userData);
};

const verifyOTP = (otpData) => {
  return axiosClient.post(`${path}/verify-otp`, otpData);
};

const googleLogin = (credential) => {
  return axiosClient.post(`${path}/google`, { credential });
};

const facebookLogin = (accessToken) => {
  return axiosClient.post(`${path}/facebook`, { accessToken });
};

const forgotPassword = (email) => {
  return axiosClient.post(`${path}/forgot-password`, { email });
};

const verifyResetOTP = (data) => {
  return axiosClient.post(`${path}/verify-reset-otp`, data); // { email, otp }
};

const setPassword = (data) => {
  return axiosClient.post(`${path}/set-password`, data); // { resetToken, password }
};

const logout = () => {
  return axiosClient.post(`${path}/logout`);
};

export const authApi = { login, register, verifyOTP, googleLogin, facebookLogin, forgotPassword, verifyResetOTP, setPassword, logout };