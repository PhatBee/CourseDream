// src/routes/discussion.routes.js
import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { checkEnrollment } from "../../middlewares/enrollment.middleware.js";
import {
  postDiscussion,
  postReply,
  getDiscussions,
  voteDiscussion,
  markBestAnswerController,
  deleteDiscussion,
  getDiscussionById,
  getDiscussionReplies,
} from "../discussion/discussion.controller.js";

const router = express.Router();

router.get("/", getDiscussions); // GET /api/discussions?courseId=123&lessonId=456
router.post("/", verifyToken, checkEnrollment, postDiscussion); // POST /api/discussions/courses/123 (body: { lessonId, title, content })
router.post("/:discussionId/replies", verifyToken, checkEnrollment, postReply); // POST /api/discussions/123/replies

router.patch(
  "/:discussionId/vote",
  verifyToken,
  checkEnrollment,
  voteDiscussion,
); // PATCH /api/discussions/123/vote

router.patch(
  "/:discussionId/best-answer",
  verifyToken,
  markBestAnswerController,
);
router.delete("/:discussionId", verifyToken, deleteDiscussion);

router.get("/:discussionId", getDiscussionById);
router.get("/:discussionId/replies", getDiscussionReplies); // GET /api/discussions/123/replies?page=1&limit=5

export default router;
