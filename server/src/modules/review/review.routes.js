import express from "express";
import { createOrUpdateReview } from "./review.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/:courseId", verifyToken, createOrUpdateReview);

export default router;