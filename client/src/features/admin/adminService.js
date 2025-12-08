import { adminApi } from "../../api/adminApi";


const getPendingCourses = async (params) => {
    const response = await adminApi.getPendingCourses(params);
    return response.data;
};

const getPendingCourseDetail = async (revisionId) => {
    const response = await adminApi.getPendingCourseDetail(revisionId);
    return response.data;
};

const approveCourse = async (revisionId) => {
    const response = await adminApi.approveCourse(revisionId);
    return response.data;
};

const rejectCourse = async (revisionId, reviewMessage) => {
    const response = await adminApi.rejectCourse(revisionId, reviewMessage);
    return response.data;
};

export const adminService = {
    getPendingCourses,
    getPendingCourseDetail,
    approveCourse,
    rejectCourse
};

export default adminService;