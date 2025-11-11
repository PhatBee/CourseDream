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
export const authApi = { login, register, verifyOTP, googleLogin, facebookLogin };