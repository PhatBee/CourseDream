import Notification from "../notification/notification.model.js";
import { getIO } from "../socket/index.js";
import { sendEmailNotification } from "../../utils/notify.js";
import User from "../auth/auth.model.js";

class NotificationService {
  async createNotification({
    recipient,
    sender,
    type,
    title,
    message,
    metadata,
  }) {
    // 🚀 BỔ SUNG PROMOTION VÀ COURSE_COMPLETED VÀO ĐÂY
    // 1. NHÓM CHỈ GỬI EMAIL (Không lưu DB, không báo realtime)
    const emailOnlyTypes = [
      "purchase_success",
      "new_lesson",
      "promotion",
      "course_completed",
    ];

    if (emailOnlyTypes.includes(type)) {
      const recipientUser = await User.findById(recipient).select("email name");
      if (recipientUser?.email) {
        sendEmailNotification({
          to: recipientUser.email,
          name: recipientUser.name,
          title,
          message,
          metadata,
        }).catch(console.error);
      }
      return null; // Thoát luôn
    }

    // 2. NHÓM LƯU DATABASE & IN-APP (Các type còn lại)
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      metadata,
    });

    await notification.populate("sender", "name avatar");

    // Realtime Socket
    getIO().to(`user_${recipient}`).emit("new_notification", {
      _id: notification._id,
      title,
      message,
      type,
      sender: notification.sender,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      read: false,
    });

    // Option: Cảnh báo quan trọng vừa hiện In-app vừa gửi Email
    const importantTypes = ["warning", "system", "reward_voucher"];
    if (importantTypes.includes(type)) {
      const recipientUser = await User.findById(recipient).select("email name");
      if (recipientUser?.email) {
        sendEmailNotification({
          to: recipientUser.email,
          name: recipientUser.name,
          title,
          message,
          metadata,
        }).catch(console.error);
      }
    }

    return notification;
  }

  // Lấy danh sách thông báo của user
  async getUserNotifications(userId, page = 1, limit = 15) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .populate("sender", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Notification.countDocuments({ recipient: userId }),

      Notification.countDocuments({ recipient: userId, read: false }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  // Đánh dấu 1 thông báo đã đọc
  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true },
    );

    if (!notification)
      throw new Error("Thông báo không tồn tại hoặc không thuộc về bạn");

    return notification;
  }

  // Đánh dấu tất cả đã đọc
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true },
    );

    return { modifiedCount: result.modifiedCount };
  }
}

export default new NotificationService();
