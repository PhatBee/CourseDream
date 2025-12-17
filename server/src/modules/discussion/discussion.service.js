// src/services/discussion.service.js
import Discussion from "../discussion/discussion.model.js";
import { getIO } from "../socket/index.js";
import { sendEmailNotification } from "../../utils/notify.js";
import User from "../auth/auth.model.js";
import notificationService from "../notification/notification.service.js";

export const createDiscussion = async (courseId, authorId, content) => {
  return await Discussion.create({ course: courseId, author: authorId, content });
};

export const replyToDiscussion = async (discussionId, authorId, content) => {
  const discussion = await Discussion.findByIdAndUpdate(
    discussionId,
    { $push: { replies: { author: authorId, content } } },
    { new: true }
  )
    .populate("author", "name email")
    .populate("replies.author", "name avatar")
    .populate("course", "slug");

  if (discussion.author && discussion.author._id.toString() !== authorId.toString()) {
    const latestReply = discussion.replies[discussion.replies.length - 1];
    const replyAuthorName = latestReply.author?.name || "Ai đó";

    // Gửi notification cho author
    await notificationService.createNotification({
      recipient: discussion.author._id,
      sender: authorId,
      type: "reply",
      title: "Có trả lời mới trong thảo luận của bạn",
      message: `${replyAuthorName} đã trả lời: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
      relatedId: discussionId,
      courseSlug: discussion.course?.slug,
    });
  }

  return discussion;
};

export const getDiscussionsByCourse = async (courseId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  // Chỉ lấy thảo luận có isHidden: false (chủ đề hiển thị)
  const [discussions, total] = await Promise.all([
    Discussion.find({ course: courseId, isHidden: false })
      .populate("author", "name avatar")
      .populate("replies.author", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Discussion.countDocuments({ course: courseId, isHidden: false })
  ]);

  // Trong mỗi thảo luận, chỉ lấy reply có isHidden: false (reply hiển thị)
  const filteredDiscussions = discussions.map(discussion => {
    const filteredReplies = discussion.replies.filter(reply => reply.isHidden === false);
    return {
      ...discussion.toObject(),
      replies: filteredReplies
    };
  });

  return {
    discussions: filteredDiscussions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};