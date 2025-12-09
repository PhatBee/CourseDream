import express from "express";
import { getInstructorStats, getProfile, updateProfile } from "./instructor.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/stats", verifyToken, getInstructorStats);

// Profile Instructor
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

export default router;