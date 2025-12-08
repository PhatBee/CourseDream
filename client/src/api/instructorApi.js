import axiosClient from "./axiosClient";

const path = "/instructor";

export const getInstructorStats = () => {
  return axiosClient.get("/instructor/stats");
};

// [MỚI] Lấy thông tin profile
const getInstructorProfile = () => {
  return axiosClient.get(`${path}/profile`);
};

// [MỚI] Cập nhật thông tin profile
const updateInstructorProfile = (data) => {
  return axiosClient.put(`${path}/profile`, data);
};

export const instructorApi = {
    getInstructorStats,
    getInstructorProfile,
    updateInstructorProfile
};