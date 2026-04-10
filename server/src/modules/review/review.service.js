import mongoose from "mongoose";
import Review from "./review.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import Course from "../course/course.model.js";
import InstructorProfile from "../user/InstructorProfile.model.js";

export const addOrUpdateReview = async ({
  userId,
  courseId,
  rating,
  comment,
}) => {
  // 1. Validate course tồn tại
  const courseExists = await Course.exists({ _id: courseId });
  if (!courseExists) throw new Error("Khóa học không tồn tại");

  // 2. Validate đã mua khóa học chưa
  const enrolled = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });
  if (!enrolled) {
    const e = new Error(
      "Bạn phải mua khóa học mới được đánh giá (Verified Purchase)",
    );
    e.status = 403;
    throw e;
  }

  let session = null;

  // 3. Detect MongoDB Replica Set an toàn
  const isReplicaSet =
    mongoose.connection.readyState === 1 &&
    mongoose.connection.client?.topology?.description?.type ===
      "ReplicaSetWithPrimary";

  if (isReplicaSet) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  const queryOpt = session
    ? { new: true, upsert: true, session }
    : { new: true, upsert: true };

  try {
    const finalReview = await Review.findOneAndUpdate(
      { student: userId, course: courseId, isDeleted: false },
      {
        $set: { rating, comment, isEdited: true }, // Mặc định Update sẽ là edited
        $setOnInsert: { student: userId, course: courseId, isHidden: false }, // Chỉ ghi lúc Insert
      },
      queryOpt,
    );

    // Logic phân biệt Insert vs Update: Tuyệt đối chuẩn với mongoose
    // Khi Mongoose tạo document mới qua Upsert, createdAt và updatedAt được tạo cùng lúc -> bằng nhau
    if (
      finalReview.createdAt.getTime() === finalReview.updatedAt.getTime() &&
      finalReview.isEdited
    ) {
      finalReview.isEdited = false;
      const saveOpt = session ? { session } : {};
      await finalReview.save(saveOpt);
    }

    await updateEntitiesRating(courseId, session);

    if (session && session.inTransaction()) await session.commitTransaction();
    return finalReview;
  } catch (err) {
    if (session && session.inTransaction()) await session.abortTransaction();
    throw err;
  } finally {
    if (session) session.endSession();
  }
};

export const updateEntitiesRating = async (courseId, session = null) => {
  const aggregateOptions = session ? { session } : {};

  // Lưu ý: Aggregation là bottleneck với >= 50k review.
  // Để tối ưu cao hơn, team cần chuyển đổi sang Background Job hoặc Update Incremental O(1)
  const stats = await Review.aggregate(
    [
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
          isDeleted: false,
          isHidden: false,
        },
      },
      {
        $group: {
          _id: "$course",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ],
    aggregateOptions,
  );

  const courseStats = stats[0] ?? { avgRating: 0, totalReviews: 0 };

  const course = await Course.findByIdAndUpdate(
    courseId,
    {
      rating: parseFloat(courseStats.avgRating.toFixed(1)),
      totalReviews: courseStats.totalReviews,
    },
    { new: true, session },
  );

  if (course && course.instructor) {
    // Nếu tương lai bạn viết thêm hàm recalculateStats thì dùng
    if (typeof InstructorProfile.recalculateStats === "function") {
      await InstructorProfile.recalculateStats(course.instructor, session);
    } else {
      // Tận dụng pre('save') bạn đã có sẵn
      // Tìm profile và gọi save() để Mongo kích hoạt hàm tính toán bên trong model InstructorProfile
      const profile = await InstructorProfile.findOne({
        user: course.instructor,
      });
      // Nếu có dùng session (transaction) thì nhớ gán vào
      if (profile) {
        const saveOpt = session ? { session } : {};
        await profile.save(saveOpt);
      }
    }
  }
};
