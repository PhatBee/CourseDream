// src/api/userApi.js
import axiosClient from "./axiosClient";

const path = "/users";

/**
 * Cập nhật profile (name, avatar, bio)
 * @param {FormData} profileData - Phải là đối tượng FormData
 */
const updateProfile = (profileData) => {
  // Axios tự xử lý header khi data là FormData
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