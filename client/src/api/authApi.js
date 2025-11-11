import axiosClient from "./axiosClient";

const path = "/auth"


const login = async (userData) => {
  return axiosClient.post(`${path}/login`, userData);
};
;
const register = (userData) => {
  return axiosClient.post(`${path}/register`, userData);
};

export const authApi = { login, register }