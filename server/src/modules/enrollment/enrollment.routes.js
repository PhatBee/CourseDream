import express from "express";
import { getMyEnrollments, getStudentDashboard } from "./enrollment.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me", verifyToken, getMyEnrollments);

router.get("/dashboard", verifyToken, getStudentDashboard);

export default router;