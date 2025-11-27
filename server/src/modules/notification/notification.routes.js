// src/routes/notification.routes.js
import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../notification/notification.controller.js";

const router = express.Router();

// Tất cả route đều cần đăng nhập
router.use(verifyToken);

router.get("/", getMyNotifications);
router.patch("/read-all", markAllNotificationsAsRead);
router.patch("/:notificationId/read", markNotificationAsRead);

export default router;