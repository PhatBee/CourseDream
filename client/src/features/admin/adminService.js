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


// [MỚI] Lấy danh sách đơn đăng ký
const getInstructorApplications = async (params) => {
    const response = await adminApi.getInstructorApplications(params);
    return response.data;
};

// [MỚI] Duyệt/Từ chối đơn
const reviewInstructorApplication = async (id, data) => {
    // data = { action: 'approve' | 'reject', reason: string }
    const response = await adminApi.reviewInstructorApplication(id, data);
    return response.data;
};

export const adminService = {
    getPendingCourses,
    getPendingCourseDetail,
    approveCourse,
    rejectCourse,
    getInstructorApplications,
    reviewInstructorApplication
};

export default adminService;