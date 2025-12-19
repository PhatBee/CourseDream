import Notification from "../notification/notification.model.js";
import { getIO } from "../socket/index.js";
import { sendEmailNotification } from "../../utils/notify.js";
import User from "../auth/auth.model.js";

class NotificationService {
  // Tạo thông báo + gửi realtime + email
  async createNotification({ recipient, sender, type, title, message, relatedId, courseSlug,replyId }) {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedId,
      courseSlug,
      replyId, 
    });

    // Populate để frontend nhận được thông tin sender
    await notification.populate("sender", "name avatar");

    // 1. Gửi realtime qua Socket.io
    getIO().to(`user_${recipient}`).emit("new_notification", {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      sender: notification.sender,
      relatedId: notification.relatedId,
      createdAt: notification.createdAt,
      read: false,
      courseSlug: notification.courseSlug,
      replyId: notification.replyId,
    });

    // 2. Gửi email (tùy chọn)
    const recipientUser = await User.findById(recipient).select("email name");
    if (recipientUser?.email) {
      sendEmailNotification({
        to: recipientUser.email,
        name: recipientUser.name,
        title,
        message,
      }).catch(console.error); // Không await
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
      { new: true }
    );

    if (!notification) throw new Error("Thông báo không tồn tại hoặc không thuộc về bạn");

    return notification;
  }

  // Đánh dấu tất cả đã đọc
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    return { modifiedCount: result.modifiedCount };
  }
}

export default new NotificationService();