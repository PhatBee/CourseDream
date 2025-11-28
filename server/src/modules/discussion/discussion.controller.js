import { createDiscussion, replyToDiscussion, getDiscussionsByCourse } from "../discussion/discussion.service.js";

export const postDiscussion = async (req, res, next) => {
  try {
    const courseId = req.courseId;
    const author = req.user._id;
    const { content } = req.body;
    const discussion = await createDiscussion(courseId, author, content);
    res.status(201).json({ success: true, data: discussion });
  } catch (err) { next(err); }
};

export const postReply = async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const author = req.user._id;
    const { content } = req.body;
    const discussion = await replyToDiscussion(discussionId, author, content);
    res.json({ success: true, data: discussion });
  } catch (err) { next(err); }
};

export const getDiscussions = async (req, res, next) => {
  try {
    const courseId = req.courseId || req.params.courseId;
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const result = await getDiscussionsByCourse(courseId, page, limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};