import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { checkEnrollment } from "../../middlewares/enrollment.middleware.js";
import { postReport, postDiscussionReport, postReplyReport } from "../report/report.controller.js";

const router = express.Router();

router.post("/course/:courseId", verifyToken, checkEnrollment, postReport);
// Báo cáo toàn bộ discussion
router.post("/discussion/:discussionId", verifyToken, checkEnrollment, postDiscussionReport);

// Báo cáo reply cụ thể
router.post("/reply/:replyId", verifyToken, checkEnrollment, postReplyReport);

export default router;