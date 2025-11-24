import Wishlist from "./wishlist.model.js";

/**
 * POST /api/wishlist/:courseId
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    const courseId = req.params.courseId;
    let wishlist = await Wishlist.findOne({ student: user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ student: user._id, courses: [courseId] });
    } else {
      if (!wishlist.courses.map(String).includes(String(courseId))) {
        wishlist.courses.push(courseId);
        await wishlist.save();
      }
    }
    return res.json({ message: "Đã thêm vào wishlist", wishlist });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/wishlist/:courseId
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    const courseId = req.params.courseId;
    const wishlist = await Wishlist.findOneAndUpdate(
      { student: user._id },
      { $pull: { courses: courseId } },
      { new: true }
    );
    return res.json({ message: "Đã xoá khỏi wishlist", wishlist });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/wishlist
 */
export const getWishlist = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    const wishlist = await Wishlist.findOne({ student: user._id }).populate("courses");
    return res.json({ wishlist: wishlist || { courses: [] } });
  } catch (err) {
    next(err);
  }
};

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