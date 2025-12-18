import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { checkEnrollment } from "../../middlewares/enrollment.middleware.js";
import { checkRole } from '../../middlewares/role.middleware.js';
import { postReport, postDiscussionReport, postReplyReport, adminGetReports,adminGetReportDetail,adminResolveReport } from "../report/report.controller.js";

const router = express.Router();

router.post("/course/:courseId", verifyToken, checkEnrollment, postReport);
// Báo cáo toàn bộ discussion
router.post("/discussion/:discussionId", verifyToken, checkEnrollment, postDiscussionReport);

// Báo cáo reply cụ thể
router.post("/reply/:replyId", verifyToken, checkEnrollment, postReplyReport);

// Route cho admin
router.get("/admin/reports", verifyToken, checkRole("admin"), adminGetReports);
router.get("/admin/reports/:id", verifyToken, checkRole("admin"), adminGetReportDetail);
router.put("/admin/reports/:id", verifyToken, checkRole("admin"), adminResolveReport);

export default router;