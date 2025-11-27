// src/services/discussion.service.js
import Discussion from "../discussion/discussion.model.js";
import { getIO } from "../socket/index.js";
import { sendEmailNotification } from "../../utils/notify.js";
import User from "../auth/auth.model.js";

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
    .populate("replies.author", "name avatar");

  if (discussion.author && discussion.author._id.toString() !== authorId.toString()) {
    // Sửa ở đây: dùng discussion.replies[...] để lấy tên người trả lời mới nhất
    const latestReply = discussion.replies[discussion.replies.length - 1];
    const replyAuthorName = latestReply.author?.name || "Ai đó";

    getIO().to(`user_${discussion.author._id}`).emit("new_reply", {
      discussionId,
      reply: { content, author: { name: replyAuthorName }}
    });

    // await sendEmailNotification({
    //   recipient: discussion.author._id,
    //   sender: authorId,
    //   type: "reply",
    //   title: "Có trả lời mới trong thảo luận của bạn",
    //   message: `${replyAuthorName} đã trả lời: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
    //   relatedId: discussionId
    // });

        // Lấy email của author để gửi mail
    const recipientUser = await User.findById(discussion.author._id).select("email name");
    if (recipientUser?.email) {
      await sendEmailNotification({
        to: recipientUser.email,
        name: recipientUser.name,
        title: "Có trả lời mới trong thảo luận của bạn",
        message: `${replyAuthorName} đã trả lời: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
      });
    }
  }

  return discussion;
};

export const getDiscussionsByCourse = async (courseId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [discussions, total] = await Promise.all([
    Discussion.find({ course: courseId })
      .populate("author", "name avatar")
      .populate("replies.author", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Discussion.countDocuments({ course: courseId })
  ]);

  return {
    discussions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};