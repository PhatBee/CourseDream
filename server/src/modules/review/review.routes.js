import express from "express";
import {
  createOrUpdateReview,
  getCourseReviews,
  softDeleteReview,
  toggleLikeReview,
  replyReview, // ✅ Mới
} from "./review.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { checkRole } from "../../middlewares/role.middleware.js"; // Import role validator

const router = express.Router();

router.post("/:courseId/reviews", verifyToken, createOrUpdateReview);
router.get("/:courseId/reviews", getCourseReviews);

router.delete("/:reviewId", verifyToken, softDeleteReview);
router.post("/:reviewId/like", verifyToken, toggleLikeReview);

// Route mới cho Instructor/Admin trả lời Review
router.post(
  "/:reviewId/reply",
  verifyToken,
  checkRole("instructor", "admin"),
  replyReview,
);

export default router;
