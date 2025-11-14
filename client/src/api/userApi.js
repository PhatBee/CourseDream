// src/api/userApi.js
import axiosClient from "./axiosClient";

const path = "/users";

/**
 * Cập nhật profile (name, avatar, bio)
 */
const updateProfile = (profileData) => {
  return axiosClient.put(`${path}/profile`, profileData);
};

/**
 * Cập nhật mật khẩu
 */
const changePassword = (passwordData) => {
  return axiosClient.put(`${path}/password`, passwordData);
};

export const userApi = {
  updateProfile,
  changePassword,
};