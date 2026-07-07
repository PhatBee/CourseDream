import axiosClient from "./axiosClient";

const path = "/admin";

/**
 * Đăng nhập Admin - endpoint public, không cần token
 */
const adminLogin = (userData) => {
    return axiosClient.post(`${path}/login`, userData);
};

const getDashboardStats = () => {
    return axiosClient.get(`${path}/dashboard-stats`);
};

/**
 * @param {string} type - 'year' | 'month' | 'week'
 */
const getRevenueAnalytics = (type = 'year') => {
    return axiosClient.get(`${path}/revenue-analytics`, { params: { type } });
};

const getPendingApplications = () => {
    return axiosClient.get(`${path}/instructor-applications`);
};

const reviewApplication = (userId, data) => {
    return axiosClient.put(`${path}/instructor-applications/${userId}`, data);
};

const getPendingCourses = (params) => {
    return axiosClient.get(`${path}/courses/pending`, { params });
};

const getPendingCourseDetail = (revisionId) => {
    return axiosClient.get(`${path}/courses/pending/${revisionId}`);
};

const approveCourse = (revisionId) => {
    return axiosClient.post(`${path}/courses/approve/${revisionId}`);
};

const rejectCourse = (revisionId, reviewMessage) => {
    return axiosClient.post(`${path}/courses/reject/${revisionId}`, { reviewMessage });
};



const getStudents = (params) => {
    return axiosClient.get(`${path}/users`, { params });
};

const getInstructors = (params) => {
    return axiosClient.get(`${path}/instructors`, { params });
};

const toggleBlockUser = (userId, reason) => {
    return axiosClient.patch(`${path}/users/${userId}/toggle-block`, { reason });
};

const getInstructorApplications = (params) => {
    return axiosClient.get(`${path}/instructors/applications`, { params });
};

const reviewInstructorApplication = (id, data) => {
    // data = { action: 'approve' | 'reject', reason: string }
    return axiosClient.post(`${path}/instructors/applications/${id}/review`, data);
}

// CASE 3: Yêu cầu sửa
const requestRevisionChanges = (revisionId, reviewMessage) => {
    return axiosClient.patch(`${path}/revisions/${revisionId}/request-changes`, { reviewMessage });
};

// CASE 7: Unpublish
const unpublishCourse = (courseId, reason) => {
    return axiosClient.patch(`${path}/courses/${courseId}/unpublish`, { reason });
};

// CASE 8: Suspend
const suspendCourse = (courseId, reason) => {
    return axiosClient.patch(`${path}/courses/${courseId}/suspend`, { reason });
};

// Restore from suspended
const restoreCourse = (courseId) => {
    return axiosClient.patch(`${path}/courses/${courseId}/restore`);
};

// Get all courses (Admin dashboard)
const getAllCourses = (params) => {
    return axiosClient.get(`${path}/courses`, { params });
};

// Republish: unpublished → published
const republishCourse = (courseId) => {
    return axiosClient.patch(`${path}/courses/${courseId}/republish`);
};

const getVideoSignedUrl = (videoUrl) => {
    return axiosClient.get(`${path}/video-signature`, { params: { videoUrl } });
};

export const adminApi = {
    adminLogin,
    getDashboardStats,
    getRevenueAnalytics,
    getPendingApplications,
    reviewApplication,
    getPendingCourses,
    getPendingCourseDetail,
    approveCourse,
    rejectCourse,
    getStudents,
    getInstructors,
    toggleBlockUser,
    getInstructorApplications,
    reviewInstructorApplication,
    requestRevisionChanges,
    unpublishCourse,
    suspendCourse,
    restoreCourse,
    getAllCourses,
    republishCourse,
    getVideoSignedUrl,
};
