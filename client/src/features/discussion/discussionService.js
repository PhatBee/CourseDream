import * as discussionApi from "../../api/discussionApi";

const discussionService = {
  getDiscussions: async (courseId, lectureId, page = 1, limit = 10) => {
    const res = await discussionApi.getDiscussionsByCourse(
      courseId,
      lectureId,
      page,
      limit,
    );
    return res.data;
  },
  addDiscussion: async (courseId, lectureId, title, content) => {
    const res = await discussionApi.createDiscussion(
      courseId,
      lectureId,
      title,
      content,
    );
    return res.data;
  },
  replyDiscussion: async (discussionId, content) => {
    const res = await discussionApi.replyToDiscussion(discussionId, content);
    return res.data;
  },
  voteDiscussion: async (discussionId, targetType, targetId) => {
    const res = await discussionApi.voteDiscussion(
      discussionId,
      targetType,
      targetId,
    );
    return res.data;
  },
  markBestAnswer: async (discussionId, replyId) => {
    const res = await discussionApi.markBestAnswer(discussionId, replyId);
    return res.data;
  },
  deleteDiscussion: async (discussionId) => {
    const res = await discussionApi.deleteDiscussion(discussionId);
    return res.data;
  },
};
export default discussionService;
