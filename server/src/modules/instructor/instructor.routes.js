import express from "express";
import { getInstructorDashboard, getProfile, updateProfile, getCourseStudents } from "./instructor.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/dashboard", verifyToken, getInstructorDashboard);

// Profile Instructor
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

// Course enrolled students
router.get("/courses/:courseId/students", verifyToken, getCourseStudents);

export default router;