import express from "express";
import { createOrUpdateReview, getCourseReviews } from "./review.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/:courseId", verifyToken, createOrUpdateReview);
router.get("/:courseId", getCourseReviews);

export default router;