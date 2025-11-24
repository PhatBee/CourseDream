import express from "express";
import { searchCourses, getLecture } from "./course.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/search", searchCourses);
router.get("/:courseId/lectures/:lectureId", verifyToken, getLecture);

export default router;