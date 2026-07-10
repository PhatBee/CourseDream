import express from "express";
import { getMyEnrollments, getStudentDashboard, activateCourse } from "./enrollment.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me", verifyToken, getMyEnrollments);

router.get("/dashboard", verifyToken, getStudentDashboard);

router.post("/:enrollmentId/activate", verifyToken, activateCourse);

export default router;