import express from "express";
import { getMyEnrollments } from "./enrollment.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me", verifyToken, getMyEnrollments);

export default router;