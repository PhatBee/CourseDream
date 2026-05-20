// src/services/discussion.service.js
import mongoose from "mongoose";
import Discussion from "../discussion/discussion.model.js";
import { getIO } from "../socket/index.js";
import { sendEmailNotification } from "../../utils/notify.js";
import User from "../auth/auth.model.js";
import notificationService from "../notification/notification.service.js";
import Course from "../course/course.model.js";
import DiscussionReply from "./discussionReply.model.js";

// Khởi tạo thảo luận
export const createDiscussion = async (
  courseId,
  lectureId,
  authorId,
  title,
  content,
) => {
  if (!mongoose.Types.ObjectId.isValid(courseId))
    throw new Error("courseId không hợp lệ");

  const courseExists = await Course.exists({ _id: courseId });
  if (!courseExists) throw new Error("Course không tồn tại");

  if (lectureId) {
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      throw new Error("lectureId không hợp lệ");
    }
  }

  return await Discussion.create({
    course: courseId,
    lectureId,
    author: authorId,
    title,
    content,
  });
};

// Đánh dấu Best Answer
export const markBestAnswer = async (
  discussionId,
  replyId,
  userId,
  isInstructor,
) => {
  if (!mongoose.Types.ObjectId.isValid(discussionId))
    throw new Error("ID cuộc thảo luận không hợp lệ");
  if (!mongoose.Types.ObjectId.isValid(replyId))
    throw new Error("ID reply không hợp lệ");

  const discussion = await Discussion.findById(discussionId);
  if (!discussion) throw new Error("Không tìm thấy cuộc thảo luận");

  // Kiểm tra quyền (chỉ giảng viên, admin hoặc tác giả câu hỏi mới được mark)
  if (!isInstructor && discussion.author.toString() !== userId.toString()) {
    throw new Error("Không có quyền đánh dấu Câu trả lời hay nhất");
  }

  const replyToMark = await DiscussionReply.findById(replyId);
  if (!replyToMark) throw new Error("Reply not found");

  // Xóa status best answer cũ nếu đã có
  if (discussion.bestAnswerId) {
    if (discussion.bestAnswerId.toString() === replyId) {
      // Bỏ đánh dấu best answer hiện tại nếu user click lại
      replyToMark.isBestAnswer = false;
      await replyToMark.save();
      discussion.bestAnswerId = null;
      discussion.status = "OPEN";
      await discussion.save();
      return discussion.populate({
        path: "bestAnswerId",
        populate: { path: "author", select: "name avatar" },
      });
    } else {
      // Gỡ dấu câu cũ
      await DiscussionReply.findByIdAndUpdate(discussion.bestAnswerId, {
        isBestAnswer: false,
      });
    }
  }

  // Đánh dấu mới
  replyToMark.isBestAnswer = true;
  await replyToMark.save();

  // Cập nhật lại Discussion
  discussion.bestAnswerId = replyId;
  discussion.status = "RESOLVED";
  await discussion.save();

  // Lấy data mới nhất để trả về Client UI
  return discussion.populate({
    path: "bestAnswerId",
    populate: { path: "author", select: "name avatar" },
  });
};

// Vote/Unvote (Sửa logic Vote ANSWER vì đã tách collection riêng)
export const toggleUpvote = async (
  discussionId,
  targetType,
  targetId,
  userId,
) => {
  if (!["DISCUSSION", "ANSWER"].includes(targetType)) {
    throw new Error(
      "TargetType không hợp lệ (Chỉ chấp nhận DISCUSSION/ANSWER)",
    );
  }

  if (!mongoose.Types.ObjectId.isValid(discussionId))
    throw new Error("ID cuộc thảo luận không hợp lệ");

  const userIdObj = userId;

  if (targetType === "DISCUSSION") {
    let result = await Discussion.findOneAndUpdate(
      { _id: discussionId, upvotedBy: { $ne: userIdObj } },
      { $push: { upvotedBy: userIdObj }, $inc: { upvoteCount: 1 } },
      { new: true },
    );

    if (!result) {
      // Đã vote rồi -> Rút vote
      result = await Discussion.findOneAndUpdate(
        { _id: discussionId, upvotedBy: userIdObj },
        { $pull: { upvotedBy: userIdObj }, $inc: { upvoteCount: -1 } },
        { new: true },
      );
    }
    if (!result) throw new Error("Không tìm thấy cuộc thảo luận");
    return result;
  } else if (targetType === "ANSWER") {
    // SỬA ĐỔI QUAN TRỌNG: Vote vào DiscussionReply
    if (!mongoose.Types.ObjectId.isValid(targetId))
      throw new Error("targetId không hợp lệ");

    let result = await DiscussionReply.findOneAndUpdate(
      {
        _id: targetId,
        discussionId: discussionId,
        upvotedBy: { $ne: userIdObj },
      },
      { $push: { upvotedBy: userIdObj }, $inc: { upvoteCount: 1 } },
      { new: true },
    );

    if (!result) {
      // Đã vote rồi -> Rút vote
      result = await DiscussionReply.findOneAndUpdate(
        { _id: targetId, discussionId: discussionId, upvotedBy: userIdObj },
        { $pull: { upvotedBy: userIdObj }, $inc: { upvoteCount: -1 } },
        { new: true },
      );
    }
    if (!result) throw new Error("Không tìm thấy câu trả lời");
    return result;
  }
};

// Đăng Reply
export const replyToDiscussion = async (discussionId, authorId, content) => {
  if (!mongoose.Types.ObjectId.isValid(discussionId)) {
    throw new Error("ID cuộc thảo luận không hợp lệ");
  }

  const checkDiscussion = await Discussion.findOne({
    _id: discussionId,
    isHidden: false,
    deletedAt: null,
  }).populate("course", "slug");
  if (!checkDiscussion) {
    throw new Error("Không tìm thấy cuộc thảo luận, hoặc đã bị ẩn/xóa");
  }

  const newReply = await DiscussionReply.create({
    discussionId,
    author: authorId,
    content,
  });

  await Discussion.findByIdAndUpdate(discussionId, {
    $inc: { answerCount: 1 },
  });

  if (checkDiscussion.author.toString() !== authorId.toString()) {
    await notificationService
      .createNotification({
        recipient: checkDiscussion.author,
        sender: authorId,
        type: "reply",
        title: "Có người vừa trả lời thảo luận của bạn",
        message: `Thảo luận "${checkDiscussion.title}" có mội bình luận mới.`,
        metadata: {
          courseSlug: checkDiscussion.course?.slug,
          lessonId: checkDiscussion.lectureId,
          discussionId: checkDiscussion._id,
          replyId: newReply._id,
        },
      })
      .catch((err) => console.error("Lỗi gửi thông báo reply thảo luận:", err));
  }

  return newReply.populate("author", "name avatar");
};

// Phân trang Replies
export const getRepliesByDiscussion = async (
  discussionId,
  page = 1,
  limit = 5,
) => {
  const skip = (page - 1) * limit;
  const query = { discussionId, isHidden: false };

  const [replies, total] = await Promise.all([
    DiscussionReply.find(query)
      .populate("author", "name avatar")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    DiscussionReply.countDocuments(query),
  ]);

  return {
    replies,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// Lấy danh sách Discussion có Best Answer
export const getDiscussionsByCourse = async (
  courseId,
  lectureId = null,
  status = null,
  sortParam = null,
  page = 1,
  limit = 10,
) => {
  if (!mongoose.Types.ObjectId.isValid(courseId))
    throw new Error("courseId không hợp lệ");

  if (lectureId && !mongoose.Types.ObjectId.isValid(lectureId))
    throw new Error("lectureId không hợp lệ");

  const skip = (page - 1) * limit;
  const query = { course: courseId, isHidden: false, deletedAt: null };

  if (lectureId) {
    query.$or = [
      { lectureId },
      { lectureId: null },
      { lectureId: { $exists: false } },
    ];
  }
  if (status) {
    query.status = status;
  }

  let sortOption = { createdAt: -1 };
  if (sortParam === "most_voted") {
    sortOption = { upvoteCount: -1, createdAt: -1 };
  }

  const [discussions, total] = await Promise.all([
    Discussion.find(query)
      .populate("author", "name avatar")
      .populate({
        path: "bestAnswerId",
        populate: { path: "author", select: "name avatar" },
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Discussion.countDocuments(query),
  ]);

  return {
    discussions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const softDeleteDiscussion = async (
  discussionId,
  userId,
  isAdminOrInstructor,
) => {
  if (!mongoose.Types.ObjectId.isValid(discussionId))
    throw new Error("ID cuộc thảo luận không hợp lệ");

  const discussion = await Discussion.findById(discussionId);
  if (!discussion) throw new Error("Không tìm thấy cuộc thảo luận");

  if (
    !isAdminOrInstructor &&
    discussion.author.toString() !== userId.toString()
  ) {
    throw new Error("Không có quyền xoá comment này");
  }

  discussion.isHidden = true;
  discussion.deletedAt = new Date();
  discussion.deletedBy = userId;

  await discussion.save();
  return discussion;
};

export const getDiscussionDetails = async (discussionId) => {
  if (!mongoose.Types.ObjectId.isValid(discussionId))
    throw new Error("ID cuộc thảo luận không hợp lệ");

  const discussion = await Discussion.findOne({
    _id: discussionId,
    isHidden: false,
    deletedAt: null,
  })
    .populate("author", "name avatar")
    .populate({
      path: "bestAnswerId",
      populate: { path: "author", select: "name avatar" },
    });

  if (!discussion) throw new Error("Không tìm thấy cuộc thảo luận");
  return discussion;
};
