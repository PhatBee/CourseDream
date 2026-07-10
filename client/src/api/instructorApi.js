import axiosClient from "./axiosClient";

const path = "/instructor";

export const getInstructorStats = () => {
  return axiosClient.get("/instructor/stats");
};

const getInstructorDashboardStats = (timeRange) => {
  return axiosClient.get("/instructor/dashboard", { params: { timeRange } });
};

//Lấy thông tin profile
const getInstructorProfile = () => {
  return axiosClient.get(`${path}/profile`);
};

//Cập nhật thông tin profile
const updateInstructorProfile = (data) => {
  return axiosClient.put(`${path}/profile`, data);
};

// Lấy danh sách học viên của khóa học
const getCourseStudents = (courseId, params) => {
  return axiosClient.get(`${path}/courses/${courseId}/students`, { params });
};

// Gửi nhắc nhở cho học viên trễ tiến độ
const sendStudyReminder = (courseId) => {
  return axiosClient.post(`${path}/courses/${courseId}/remind-behind`);
};

export const instructorApi = {
    getInstructorStats,
    getInstructorProfile,
    updateInstructorProfile,
    getInstructorDashboardStats,
    getCourseStudents,
    sendStudyReminder
};