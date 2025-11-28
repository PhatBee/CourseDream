import notificationService from "../notification/notification.service.js";

export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;

    const result = await notificationService.getUserNotifications(userId, page, limit);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification = await notificationService.markAsRead(userId, notificationId);

    res.json({
      success: true,
      message: "Đã đánh dấu đã đọc",
      data: notification,
    });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const result = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc`,
    });
  } catch (err) {
    next(err);
  }
};