import cron from "node-cron";
import Enrollment from "../enrollment/enrollment.model.js";
import Progress from "../progress/progress.model.js";
import notificationService from "./notification.service.js";

// Chạy vào 8h sáng mỗi ngày để nhắc nhở học viên không active
cron.schedule("0 8 * * *", async () => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  // Lấy các enrollment chưa hoàn thành và lastAccessed trước 3 ngày
  const inactiveStudents = await Enrollment.find({
    progress: { $lt: 100 },
    lastAccessed: { $lte: threeDaysAgo },
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

// Chạy vào 01:00 AM mỗi ngày để quét và cập nhật trạng thái trễ tiến độ (scheduleStatus)
cron.schedule("0 1 * * *", async () => {
  console.log("⏰ Starting daily Behind Schedule status update cron job...");
  try {
    const cursor = Enrollment.aggregate([
      { $match: { isActivated: true } },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' },
      {
        $lookup: {
          from: 'progresses',
          let: { studentId: '$student', courseId: '$course' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$student', '$$studentId'] },
                    { $eq: ['$course', '$$courseId'] }
                  ]
                }
              }
            }
          ],
          as: 'progressDetails'
        }
      },
      {
        $project: {
          student: 1,
          course: 1,
          startedAt: 1,
          totalLectures: '$courseDetails.totalLectures',
          durationInWeeks: '$courseDetails.durationInWeeks',
          completedCount: {
            $cond: {
              if: { $gt: [{ $size: '$progressDetails' }, 0] },
              then: { $size: { $ifNull: [{ $arrayElemAt: ['$progressDetails.completedLectures', 0] }, []] } },
              else: 0
            }
          },
          percentage: {
            $cond: {
              if: { $gt: [{ $size: '$progressDetails' }, 0] },
              then: { $ifNull: [{ $arrayElemAt: ['$progressDetails.percentage', 0] }, 0] },
              else: 0
            }
          }
        }
      }
    ]).cursor();

    let bulkOps = [];
    const BATCH_SIZE = 1000;

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      const totalLectures = doc.totalLectures || 0;
      const durationInWeeks = doc.durationInWeeks || 12;
      const completedCount = doc.completedCount || 0;
      const percentage = doc.percentage || 0;

      const weeksElapsed = Math.max(0, (Date.now() - new Date(doc.startedAt)) / (7 * 24 * 60 * 60 * 1000));
      const learningPaceGoal = durationInWeeks > 0 ? (totalLectures / durationInWeeks) : 0;
      const E = Math.min(learningPaceGoal * weeksElapsed, totalLectures);
      const A = completedCount;

      let status = 'in-progress';
      if (A < E * 0.8 && percentage < 100) {
        status = 'behind';
      } else if (percentage >= 100) {
        status = 'completed';
      } else {
        status = 'in-progress';
      }

      bulkOps.push({
        updateOne: {
          filter: { student: doc.student, course: doc.course },
          update: { 
            $set: { scheduleStatus: status },
            $setOnInsert: { completedLectures: [], watchTimes: [], percentage: 0 }
          },
          upsert: true
        }
      });

      if (bulkOps.length >= BATCH_SIZE) {
        await Progress.bulkWrite(bulkOps);
        bulkOps = [];
      }
    }

    if (bulkOps.length > 0) {
      await Progress.bulkWrite(bulkOps);
    }
    console.log("⏰ Daily Behind Schedule status update cron job finished successfully.");
  } catch (err) {
    console.error("❌ Error in daily Behind Schedule cron job:", err);
  }
});

