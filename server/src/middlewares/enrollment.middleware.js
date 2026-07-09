import mongoose from "mongoose";
import Enrollment from "../modules/enrollment/enrollment.model.js";
import Course from "../modules/course/course.model.js";

export const checkEnrollment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    console.log("Checking enrollment for user:", userId);
    ///const { slug, courseId, discussionId, replyId } = req.params;
    const { slug, discussionId, replyId } = req.params;
    let targetCourseId =
      req.params?.courseId || req.body?.courseId || req.query?.courseId;

    //let targetCourseId = courseId;

    if (slug) {
      const course = await Course.findOne({ slug }).select("_id");
      if (!course) {
        return res.status(404).json({ message: "Khóa học không tồn tại" });
      }
      targetCourseId = course._id;
    }

    // 2. Nếu có discussionId → lấy course từ discussion (route reply)
    if (!targetCourseId && discussionId) {
      const Discussion =
        mongoose.model("Discussion") ||
        mongoose.model(
          "Discussion",
          new mongoose.Schema({
            course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
          }),
        );
      const discussion =
        await Discussion.findById(discussionId).select("course");
      if (!discussion)
        return res.status(404).json({ message: "Thảo luận không tồn tại" });
      targetCourseId = discussion.course;
    }

    // THÊM MỚI: XỬ LÝ replyId → tìm discussion chứa reply
    if (!targetCourseId && replyId) {
      const DiscussionReply = mongoose.model("DiscussionReply");
      const reply =
        await DiscussionReply.findById(replyId).select("discussionId");

      if (!reply) {
        return res.status(404).json({ message: "Bình luận không tồn tại" });
      }

      const Discussion = mongoose.model("Discussion");
      const discussion = await Discussion.findById(reply.discussionId).select(
        "course",
      );

      if (!discussion) {
        return res.status(404).json({ message: "Thảo luận gốc không tồn tại" });
      }

      targetCourseId = discussion.course;
    }

    if (!targetCourseId) {
      return res.status(400).json({ message: "Không xác định được khóa học" });
    }

    const enrollment = await Enrollment.findOne({
      student: userId,
      course: targetCourseId,
    });

    // Cho phép admin hoặc instructor của khóa học hoặc học viên đã ghi danh
    const isInstructor = await Course.findOne({
      _id: targetCourseId,
      instructor: userId,
    });

    console.log(
      "userId:",
      userId,
      "targetCourseId:",
      targetCourseId,
      "isInstructor:",
      !!isInstructor,
      "role:",
      req.user.role,
    );

    // ------------- BẮT ĐẦU ĐOẠN LOG TÌM NGUYÊN NHÂN -------------
    const debugCourse =
      await Course.findById(targetCourseId).select("instructor title");
    console.log("\n--- BẮT ĐẦU PHÂN TÍCH LỖI INSTRUCTOR ---");
    console.log("1. Khóa học truy cập    :", debugCourse?.title);
    console.log("2. ID user đang request :", userId, "| Kiểu:", typeof userId);
    console.log(
      "3. ID instructor trên DB:",
      debugCourse?.instructor,
      "| Kiểu:",
      typeof debugCourse?.instructor,
    );

    if (debugCourse?.instructor) {
      console.log(
        "4. So sánh tuyệt đối (===)    :",
        userId === debugCourse.instructor,
      );
      console.log(
        "5. So sánh chuỗi (toString)   :",
        String(userId) === String(debugCourse.instructor),
      );
    } else {
      console.log("4. Khóa học này KHÔNG CÓ trường instructor trên DB!");
    }
    console.log("----------------------------------------\n");
    // ------------- KẾT THÚC ĐOẠN LOG TÌM NGUYÊN NHÂN -------------

    if (!enrollment && req.user.role !== "admin" && !isInstructor) {
      return res
        .status(403)
        .json({ message: "Bạn chưa đăng ký khóa học này." });
    }

    if (enrollment && req.user.role !== "admin" && !isInstructor) {
      if (!enrollment.isActivated) {
        return res
          .status(403)
          .json({ message: "Khóa học chưa được kích hoạt." });
      }
      if (enrollment.endedAt && enrollment.endedAt < new Date()) {
        return res
          .status(403)
          .json({ message: "Khóa học đã hết hạn sử dụng." });
      }
    }

    req.courseId = targetCourseId;

    next();
  } catch (error) {
    console.error("Check Enrollment Error:", error);
    res.status(500).json({ message: "Lỗi server khi kiểm tra ghi danh." });
  }
};
