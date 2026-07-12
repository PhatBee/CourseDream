import axiosClient from "./axiosClient";

const path = "/enrollments";

const enrollmentApi = {
  /**
   * Lấy danh sách khóa học đã đăng ký của user hiện tại
   * Endpoint: GET /api/enrollments/me
   */
  getMyEnrollments: () => {
    return axiosClient.get(`${path}/me`);
  },

  getStudentDashboard: () => {
    return axiosClient.get(`${path}/dashboard`);
  },

  activateEnrollment: (enrollmentId) => {
    return axiosClient.post(`${path}/${enrollmentId}/activate`);
  },

  extendEnrollment: (enrollmentId, packageId, paymentMethod = 'vnpay', platform = 'mobile') => {
    return axiosClient.post(`${path}/${enrollmentId}/extend`, { packageId, paymentMethod, platform });
  }
};

export default enrollmentApi;