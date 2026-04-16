import {
  createDiscussion,
  replyToDiscussion,
  getDiscussionsByCourse,
  toggleUpvote,
  markBestAnswer,
  softDeleteDiscussion,
  getDiscussionDetails,
} from "../discussion/discussion.service.js";
import mongoose from "mongoose";

export const postDiscussion = async (req, res, next) => {
  try {
    const { courseId, lectureId, title, content } = req.body;
    const authorId = req.user._id;

    if (!courseId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu courseId" });
    }

    // Validation cơ bản
    if (!title || title.trim().length < 5) {
      return res
        .status(400)
        .json({ success: false, message: "Tiêu đề phải có ít nhất 5 ký tự" });
    }
    if (!content || content.trim().length < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Nội dung không được để trống" });
    }

    const discussion = await createDiscussion(
      courseId,
      lectureId,
      authorId,
      title,
      content,
    );
    res.status(201).json({ success: true, data: discussion });
  } catch (err) {
    next(err);
  }
};

export const postReply = async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const author = req.user._id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nội dung không được để trống" });
    }

    const discussion = await replyToDiscussion(discussionId, author, content);
    res.json({ success: true, data: discussion });
  } catch (err) {
    next(err);
  }
};

export const getDiscussions = async (req, res, next) => {
  try {
    const { courseId, lectureId, status, sort } = req.query;
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;

    if (!courseId) {
      return res
        .status(400)
        .json({ success: false, message: "courseId is required in query" });
    }

    const result = await getDiscussionsByCourse(
      courseId,
      lectureId,
      status,
      sort,
      page,
      limit,
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getDiscussionById = async (req, res, next) => {
  try {
    const { discussionId } = req.params;

    // Bổ sung Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({
        success: false,
        message: "ID thảo luận không hợp lệ",
      });
    }

    const discussion = await getDiscussionDetails(discussionId);

    return res.json({ success: true, data: discussion });
  } catch (err) {
    next(err);
  }
};

export const voteDiscussion = async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const { targetType, targetId } = req.body; // targetType: 'DISCUSSION' hoặc 'ANSWER'
    const userId = req.user._id;

    if (!["DISCUSSION", "ANSWER"].includes(targetType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid targetType" });
    }

    if (targetType === "ANSWER" && !targetId) {
      return res.status(400).json({
        success: false,
        message: "targetId là bắt buộc khi vote ANSWER",
      });
    }

    const updated = await toggleUpvote(
      discussionId,
      targetType,
      targetId,
      userId,
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const markBestAnswerController = async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const { replyId } = req.body;

    if (!replyId) {
      return res
        .status(400)
        .json({ success: false, message: "replyId is required" });
    }

    const userId = req.user._id;
    const isInstructor =
      req.user.role === "instructor" || req.user.role === "admin";

    const updated = await markBestAnswer(
      discussionId,
      replyId,
      userId,
      isInstructor,
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteDiscussion = async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const userId = req.user._id;
    const isAdminOrInstructor =
      req.user.role === "instructor" || req.user.role === "admin";

    // NÂNG CẤP: Remove dynamic import sai chuẩn ở đây
    const updated = await softDeleteDiscussion(
      discussionId,
      userId,
      isAdminOrInstructor,
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
