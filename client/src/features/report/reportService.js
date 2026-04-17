import reportApi from "../../api/reportApi";

const reportService = {
  reportCourse: async (courseId, reason, description) => {
    try {
      return await reportApi.reportCourse(courseId, reason, description);
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
  reportDiscussion: async (discussionId, reason, description) => {
    try {
      return await reportApi.reportDiscussion(
        discussionId,
        reason,
        description,
      );
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
  reportReply: async (replyId, reason, description) => {
    try {
      return await reportApi.reportReply(replyId, reason, description);
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
  fetchReports: (params) => reportApi.getReports(params),
  fetchReportDetail: (id) => reportApi.getReportDetail(id),
  resolveReport: ({ id, ...data }) => reportApi.resolveReport(id, data),
};

export default reportService;
