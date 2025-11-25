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
};

export default enrollmentApi;