import axiosClient from "./axiosClient";

const path = "/auth"


const login = async (userData) => {
  return axiosClient.post(`${path}/login`, userData);
};
;


export const authApi = { login }