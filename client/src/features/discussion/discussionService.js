import * as discussionApi from "../../api/discussionApi";

const discussionService = {
  getDiscussions: async (courseId, page = 1, limit = 10) => {
    const res = await discussionApi.getDiscussionsByCourse(courseId, page, limit);
    return res.data; // chỉ trả về data
  },
  addDiscussion: async (courseId, content) => {
    const res = await discussionApi.createDiscussion(courseId, content);
    return res.data;
  },
  replyDiscussion: async (discussionId, content) => {
    const res = await discussionApi.replyToDiscussion(discussionId, content);
    return res.data;
  }
};

export default discussionService;