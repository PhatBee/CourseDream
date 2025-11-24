import Review from "./review.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import Course from "../course/course.model.js";

export const addOrUpdateReview = async ({ userId, courseId, rating, comment }) => {
  const enrolled = await Enrollment.findOne({ student: userId, course: courseId });
  if (!enrolled) {
    const e = new Error("Bạn phải mua khóa học mới được đánh giá");
    e.status = 403;
    throw e;
  }

  let review = await Review.findOne({ student: userId, course: courseId });
  if (review) {
    review.rating = rating;
    review.comment = comment;
    await review.save();
  } else {
    review = await Review.create({ student: userId, course: courseId, rating, comment });
  }

  const stats = await Review.aggregate([
    { $match: { course: review.course } },
    { $group: { _id: "$course", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);

  if (stats && stats.length) {
    await Course.findByIdAndUpdate(courseId, {
      rating: stats[0].avgRating,
      studentsCount: stats[0].count
    });
  }

  return review;
};