import cron from "node-cron";
import Enrollment from "../modules/enrollment/enrollment.model.js";
import notificationService from "../modules/notification/notification.service.js";

// Chạy vào 8h sáng mỗi ngày
cron.schedule("0 8 * * *", async () => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  // Lấy các enrollment chưa hoàn thành và lastAccessed trước 3 ngày
  const inactiveStudents = await Enrollment.find({
    progress: { $lt: 100 },
    lastAccessed: { $lte: threeDaysAgo },
    // Cần thêm cờ đã nhắc để không nhắc hoài mỗi ngày
  }).populate("course", "title slug");

  for (const enroll of inactiveStudents) {
    await notificationService.createNotification({
      recipient: enroll.student,
      type: "reminder_learning",
      title: "Tiếp tục hành trình học tập nào!",
      message: `Bạn đã bỏ quên khóa học ${enroll.course.title} vài ngày rồi. Vào học tiếp nhé!`,
      metadata: { courseSlug: enroll.course.slug },
    });
  }
});
