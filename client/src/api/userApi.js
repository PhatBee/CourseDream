// src/api/userApi.js
import axiosClient from "./axiosClient";

const path = "/users";

/**
 * Lấy thông tin profile hiện tại
 */
const getProfile = () => {
  return axiosClient.get(`${path}/profile`);
};

/**
 * Cập nhật profile (name, avatar, bio, phone)
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

const getInstructors = () => axiosClient.get(path, { params: { role: "instructor" } });


export const userApi = {
  getProfile,
  updateProfile,
  changePassword,
  getInstructors,
};