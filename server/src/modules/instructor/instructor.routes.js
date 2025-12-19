import express from "express";
import { getInstructorDashboard, getProfile, updateProfile } from "./instructor.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/dashboard", verifyToken, getInstructorDashboard);

// Profile Instructor
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

export default router;