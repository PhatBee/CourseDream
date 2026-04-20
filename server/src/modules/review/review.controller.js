import mongoose from "mongoose";
import { addOrUpdateReview, updateEntitiesRating } from "./review.service.js";
import Review from "./review.model.js";

// 1. Tạo hoặc Cập nhật
export const createOrUpdateReview = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { courseId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Mã khóa học không hợp lệ" });
    }

    const parsedRating = Number(rating);
    if (
      !Number.isFinite(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return res.status(400).json({ message: "Rating phải là số từ 1 đến 5" });
    }

    if (comment && comment.length > 1000) {
      return res.status(400).json({ message: "Comment tối đa 1000 ký tự" });
    }

    const review = await addOrUpdateReview({
      userId: req.user._id,
      courseId,
      rating: parsedRating,
      comment: comment ? comment.trim() : "",
    });

    return res.status(200).json({ message: "Đánh giá đã được lưu", review });
  } catch (err) {
    next(err);
  }
};

// 2. Lấy danh sách Feedback
export const getCourseReviews = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Mã khóa học không hợp lệ" });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    let sortOption = { createdAt: -1 };
    if (req.query.sort === "highest") sortOption = { rating: -1 };
    if (req.query.sort === "lowest") sortOption = { rating: 1 };
    if (req.query.sort === "helpful") sortOption = { likesCount: -1 };

    const query = { course: courseId, isDeleted: false, isHidden: false };

    //HIỆU SUẤT: Giảm Payload & Thêm Cache
    res.set("Cache-Control", "public, max-age=60");

    const reviews = await Review.find(query)
      .select(
        "rating comment likesCount student createdAt isEdited instructorReply likedUsers",
      ) // Lọc bỏ trường rác
      .populate("student", "name avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Review.countDocuments(query);
    res.json({ data: reviews, total, page, limit });
  } catch (err) {
    next(err);
  }
};

// 3. Xóa mềm (Soft Delete)
export const softDeleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "ID đánh giá không hợp lệ" });
    }

    const review = await Review.findById(reviewId);
    if (!review)
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    if (review.isDeleted)
      return res.status(400).json({ message: "Đánh giá đã bị xóa rồi" });

    if (
      review.student.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Không có quyền thực hiện" });
    }

    review.isDeleted = true;
    await review.save();
    await updateEntitiesRating(review.course);

    res.json({ message: "Xóa đánh giá thành công" });
  } catch (err) {
    next(err);
  }
};

// 4. Like/Unlike Feedback
export const toggleLikeReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "ID đánh giá không hợp lệ" });
    }

    //Kỹ năng cấp cao Anti-Race Condition 100% bằng DB Driver
    // Step 1: Cố gắng thả Like (Chỉ thêm khi không tồn tại userID trong mảng)
    let updatedReview = await Review.findOneAndUpdate(
      {
        _id: reviewId,
        likedUsers: { $ne: userId },
        isDeleted: false,
        isHidden: false,
      },
      { $addToSet: { likedUsers: userId }, $inc: { likesCount: 1 } },
      { new: true },
    );

    // Step 2: Nếu trả về NULL -> Nghĩa là User đã Like rồi -> Ta hủy Like
    if (!updatedReview) {
      updatedReview = await Review.findOneAndUpdate(
        { _id: reviewId, likedUsers: userId },
        { $pull: { likedUsers: userId }, $inc: { likesCount: -1 } },
        { new: true },
      );
    }

    if (!updatedReview) {
      return res
        .status(400)
        .json({ message: "Không thể thao tác trên đánh giá này" });
    }

    res.json({
      message: "Thành công",
      likesCount: updatedReview.likesCount,
      likedUsers: updatedReview.likedUsers,
    });
  } catch (err) {
    next(err);
  }
};

// 5. Phản hồi Đánh giá từ Giảng viên
export const replyReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "ID đánh giá không hợp lệ" });
    }

    if (!comment || comment.trim().length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập nội dung phản hồi" });
    }

    if (comment.length > 1000) {
      return res.status(400).json({ message: "Phản hồi tối đa 1000 ký tự" });
    }

    // Không dùng populate lồng sâu mập mờ, chỉ truy xuất review cơ bản
    const review = await Review.findById(reviewId);

    if (!review || review.isDeleted || review.isHidden) {
      return res.status(404).json({ message: "Đánh giá không tồn tại" });
    }

    // Tách bạch việc tìm chủ sở hữu Course để lấy ID tuyệt đối chuẩn
    const Course = mongoose.model("Course");
    const courseInfo = await Course.findById(review.course)
      .select("instructor")
      .lean();

    console.log("Course Instructor ID:", courseInfo.instructor);
    if (!courseInfo) {
      return res.status(404).json({ message: "Khóa học không còn tồn tại" });
    }

    const courseInstructorId =
      courseInfo.instructor?._id || courseInfo.instructor;

    console.log("Course Instructor ID (string):", String(courseInstructorId));
    // ✨ So sánh cực kỳ an toàn
    if (
      String(courseInstructorId) !== String(userId) &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Chỉ giảng viên của khóa học mới được phản hồi" });
    }

    review.instructorReply = { comment: comment.trim(), repliedAt: new Date() };
    await review.save();

    res.json({ message: "Đã phản hồi đánh giá", review });
  } catch (err) {
    next(err);
  }
};
