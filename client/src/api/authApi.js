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

export const authApi = { login, register, verifyOTP }