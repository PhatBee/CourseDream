import express from "express";
import { getInstructorStats } from "./instructor.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/stats", verifyToken, getInstructorStats);

export default router;