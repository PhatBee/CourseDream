// src/routes/discussion.routes.js
import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { checkEnrollment } from "../../middlewares/enrollment.middleware.js";
import { postDiscussion, postReply, getDiscussions } from "../discussion/discussion.controller.js";

const router = express.Router();

router.get("/course/:courseId", getDiscussions);
router.post("/course/:courseId/create", verifyToken, checkEnrollment, postDiscussion);
router.post("/reply/:discussionId", verifyToken, checkEnrollment, postReply);

export default router;