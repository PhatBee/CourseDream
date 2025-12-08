import axiosClient from "./axiosClient";

const path = "/admin";

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



export const adminApi = {
    getDashboardStats,
    getRevenueAnalytics,
    getPendingApplications,
    reviewApplication,
    getPendingCourses,
    getPendingCourseDetail,
    approveCourse,
    rejectCourse
};
