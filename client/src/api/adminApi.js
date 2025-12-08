import axiosClient from "./axiosClient";

const path = "/admin";


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
    getPendingCourses,
    getPendingCourseDetail,
    approveCourse,
    rejectCourse
};
