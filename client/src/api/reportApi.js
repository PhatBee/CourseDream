import axiosClient from "./axiosClient";

const reportApi = {
  reportCourse: (courseId, reason) =>
    axiosClient.post(`/reports/course/${courseId}`, { reason }),
  reportDiscussion: (discussionId, reason) =>
    axiosClient.post(`/reports/discussion/${discussionId}`, { reason }),
  reportReply: (replyId, reason) =>
    axiosClient.post(`/reports/reply/${replyId}`, { reason }),
  //admin
  //admin
  getReports: (params) =>
    axiosClient.get("/reports/admin/reports", { params }).then(res => res.data),
  getReportDetail: (id) =>
    axiosClient.get(`/reports/admin/reports/${id}`).then(res => res.data),
  resolveReport: (id, data) =>
    axiosClient.put(`/reports/admin/reports/${id}`, data).then(res => res.data),
};

export default reportApi;