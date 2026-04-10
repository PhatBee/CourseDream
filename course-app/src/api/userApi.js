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
    const config = {};
    if (profileData instanceof FormData) {
        config.headers = {
            "Content-Type": "multipart/form-data",
        };
    }
    return axiosClient.put(`${path}/profile`, profileData, config);
};

/**
 * Cập nhật mật khẩu
 */
const changePassword = (passwordData) => {
    return axiosClient.put(`${path}/password`, passwordData);
};

/**
 * Lấy trạng thái đơn đăng ký Instructor
 */
const getInstructorApplication = () => {
    return axiosClient.get(`${path}/profile/become-instructor`);
};

/**
 * Gửi đơn đăng ký làm Instructor
 */
const applyToBecomeInstructor = (data) => {
    return axiosClient.post(`${path}/profile/become-instructor`, data);
};

const userApi = {
    getProfile,
    updateProfile,
    changePassword,
    getInstructorApplication,
    applyToBecomeInstructor,
};

export default userApi;
