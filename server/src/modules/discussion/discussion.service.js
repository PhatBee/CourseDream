// src/services/discussion.service.js
import mongoose from "mongoose";
import Discussion from "../discussion/discussion.model.js";
import { getIO } from "../socket/index.js";
import { sendEmailNotification } from "../../utils/notify.js";
import User from "../auth/auth.model.js";
import notificationService from "../notification/notification.service.js";
import Course from "../course/course.model.js";

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

export const markBestAnswer = async (
  discussionId,
  replyId,
  userId,
  isInstructor,
) => {
  if (!mongoose.Types.ObjectId.isValid(discussionId))
    throw new Error("ID thảo luận không hợp lệ");
  if (!mongoose.Types.ObjectId.isValid(replyId))
    throw new Error("ID câu trả lời không hợp lệ");

  let discussion = await Discussion.findById(discussionId);
  if (!discussion) throw new Error("Không tìm thấy cuộc thảo luận");

  // Kiểm tra quyền
  if (!isInstructor && discussion.author.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền đánh dấu câu trả lời này");
  }

  // Tìm câu trả lời để biết trước đó nó đã là Best Answer hay chưa
  const replyToMark = discussion.replies.id(replyId);
  if (!replyToMark) throw new Error("Không tìm thấy câu trả lời");

  const isCurrentlyBest = replyToMark.isBestAnswer;

  // ÁP DỤNG MONGOOSE TRANSACTION (Mongo Session)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Dù là Tắt hay Đổi, ta cũng LUÔN Reset toàn bộ cờ của các comment về false (Xóa Best Answer)
    await Discussion.updateOne(
      { _id: discussionId },
      {
        $set: {
          "replies.$[].isBestAnswer": false,
          bestAnswerId: null,
          status: "OPEN",
        },
      },
      { session },
    );

    // 2. NẾU câu này TRƯỚC ĐÓ CHƯA ĐƯỢC CHỌN -> Giờ mới gán nó làm Best Answer (nếu trước đó chọn thì bước 1 đã undo rồi, bước 2 bỏ qua)
    if (!isCurrentlyBest) {
      await Discussion.updateOne(
        { _id: discussionId, "replies._id": replyId },
        {
          $set: {
            "replies.$.isBestAnswer": true,
            bestAnswerId: replyId,
            status: "RESOLVED",
          },
        },
        { session },
      );
    }

    await session.commitTransaction(); // Atomic commit
  } catch (err) {
    await session.abortTransaction(); // Rollback nếu có lỗi xảy ra
    throw err;
  } finally {
    session.endSession();
  }

  // Lấy dòng mới nhất trả về cho UI
  discussion = await Discussion.findById(discussionId)
    .populate("author", "name avatar")
    .populate("replies.author", "name avatar");

  return discussion;
};

// Xử lý Upvote/Downvote (Sử dụng update nguyên tử để tránh race condition)
export const toggleUpvote = async (
  discussionId,
  targetType,
  targetId,
  userId,
) => {
  // Validate Target Type tại logic Service (Bảo vệ đa lớp)
  if (!["DISCUSSION", "ANSWER"].includes(targetType)) {
    throw new Error(
      "TargetType không hợp lệ (Chỉ chấp nhận DISCUSSION/ANSWER)",
    );
  }

  if (!mongoose.Types.ObjectId.isValid(discussionId))
    throw new Error("ID cuộc thảo luận không hợp lệ");
  if (targetId && !mongoose.Types.ObjectId.isValid(targetId))
    throw new Error("targetId không hợp lệ");

  const userIdObj = userId;

  if (targetType === "DISCUSSION") {
    // Thử thêm Vote (Nơi mảng upvotedBy CHƯA CÓ userId)
    let result = await Discussion.findOneAndUpdate(
      { _id: discussionId, upvotedBy: { $ne: userIdObj } },
      { $push: { upvotedBy: userIdObj }, $inc: { upvoteCount: 1 } },
      { new: true },
    );

    // Nếu kết quả trả về null, tức là user đã vote rồi -> Tiến hành Rút Vote
    if (!result) {
      result = await Discussion.findOneAndUpdate(
        { _id: discussionId, upvotedBy: userIdObj },
        { $pull: { upvotedBy: userIdObj }, $inc: { upvoteCount: -1 } },
        { new: true },
      );
    }
    if (!result) throw new Error("Không tìm thấy cuộc thảo luận");
    return result;
  } else if (targetType === "ANSWER") {
    // Tương tự với sub-documents (Replies)
    let result = await Discussion.findOneAndUpdate(
      {
        _id: discussionId,
        "replies._id": targetId,
        "replies.upvotedBy": { $ne: userIdObj },
      },
      {
        $push: { "replies.$.upvotedBy": userIdObj },
        $inc: { "replies.$.upvoteCount": 1 },
      },
      { new: true },
    );

    if (!result) {
      result = await Discussion.findOneAndUpdate(
        {
          _id: discussionId,
          "replies._id": targetId,
          "replies.upvotedBy": userIdObj,
        },
        {
          $pull: { "replies.$.upvotedBy": userIdObj },
          $inc: { "replies.$.upvoteCount": -1 },
        },
        { new: true },
      );
    }
    if (!result) throw new Error("Không tìm thấy câu trả lời hoặc thảo luận");
    return result;
  } else {
    throw new Error("TargetType không hợp lệ (DISCUSSION/ANSWER)");
  }
};

export const replyToDiscussion = async (discussionId, authorId, content) => {
  // Validate ID chuẩn
  if (!mongoose.Types.ObjectId.isValid(discussionId)) {
    throw new Error("ID cuộc thảo luận không hợp lệ");
  }

  // Check kĩ xem có ẩn/xóa không trước khi reply
  const checkDiscussion = await Discussion.findOne({
    _id: discussionId,
    isHidden: false,
    deletedAt: null,
  });
  if (!checkDiscussion) {
    throw new Error("Không tìm thấy cuộc thảo luận, hoặc đã bị ẩn/xóa");
  }

  const discussion = await Discussion.findByIdAndUpdate(
    discussionId,
    {
      $push: { replies: { author: authorId, content } },
      $inc: { answerCount: 1 }, // FIX BUG: Cập nhật biến đếm
    },
    { new: true },
  )
    .populate("author", "name email")
    .populate("replies.author", "name avatar")
    .populate("course", "slug");

  if (!discussion) throw new Error("Không tìm thấy cuộc thảo luận");

  if (
    discussion.author &&
    discussion.author._id.toString() !== authorId.toString()
  ) {
    const latestReply = discussion.replies[discussion.replies.length - 1];
    const replyAuthorName = latestReply.author?.name || "Ai đó";

    // Gửi notification cho author TRONG TRY-CATCH để bảo vệ API
    try {
      await notificationService.createNotification({
        recipient: discussion.author._id,
        sender: authorId,
        type: "reply",
        title: "Có trả lời mới trong thảo luận của bạn",
        message: `${replyAuthorName} đã trả lời: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
        relatedId: discussionId,
        courseSlug: discussion.course?.slug,
        replyId: latestReply._id,
      });
    } catch (error) {
      console.error("Lỗi gửi notification (replyToDiscussion):", error);
    }
  }

  return discussion;
};

export const getDiscussionsByCourse = async (
  courseId,
  lectureId = null, // ĐÃ SỬA
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

  // ĐÃ SỬA
  if (lectureId) {
    query.lectureId = lectureId;
  }
  if (status) {
    query.status = status;
  }

  // Tùy chỉnh Sort
  let sortOption = { createdAt: -1 };
  if (sortParam === "most_voted") {
    sortOption = { upvoteCount: -1, createdAt: -1 };
  }

  const [discussions, total] = await Promise.all([
    Discussion.find(query)
      .populate("author", "name avatar")
      .populate({
        path: "replies.author",
        select: "name avatar",
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Discussion.countDocuments(query),
  ]);

  const filteredDiscussions = discussions.map((discussion) => {
    // Chỉ lấy reply không bị ẩn
    let filteredReplies = discussion.replies.filter(
      (reply) => reply.isHidden === false,
    );

    // NÂNG CẤP SENIOR: Sort đẩy best answer lên đầu (Rule 4.1)
    filteredReplies = filteredReplies.sort(
      (a, b) =>
        (b.isBestAnswer === true ? 1 : 0) - (a.isBestAnswer === true ? 1 : 0),
    );

    return {
      ...discussion.toObject(),
      replies: filteredReplies,
    };
  });

  return {
    discussions: filteredDiscussions,
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
    .populate("replies.author", "name avatar");

  if (!discussion) throw new Error("Thảo luận không tồn tại hoặc đã bị xóa");

  // Lọc bỏ các replies bị xóa
  const filteredReplies = discussion.replies.filter((reply) => !reply.isHidden);
  filteredReplies.sort(
    (a, b) =>
      (b.isBestAnswer === true ? 1 : 0) - (a.isBestAnswer === true ? 1 : 0),
  );

  return { ...discussion.toObject(), replies: filteredReplies };
};
