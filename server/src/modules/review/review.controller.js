import { addOrUpdateReview } from "./review.service.js";
import Review from "./review.model.js";
/**
 * POST /api/reviews/:courseId
 */
export const createOrUpdateReview = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    const { courseId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating phải từ 1 đến 5" });
    }

    const review = await addOrUpdateReview({
      userId: user._id,
      courseId,
      rating,
      comment
    });

    return res.json({ message: "Đánh giá đã lưu", review });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reviews/:courseId
 */
export const getCourseReviews = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const reviews = await Review.find({ course: courseId })
      .populate("student", "name avatar")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};