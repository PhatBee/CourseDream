import Enrollment from "./enrollment.model.js";

export const getMyEnrollments = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    const enrollments = await Enrollment.find({ student: user._id })
      .populate("course", "title slug thumbnail price")
      .sort({ enrolledAt: -1 });

    return res.json({ total: enrollments.length, enrollments });
  } catch (err) {
    next(err);
  }
};