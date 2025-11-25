import * as enrollmentService from "./enrollment.service.js";

export const getMyEnrollments = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    const enrollments = await enrollmentService.getMyEnrollments(user._id);

    return res.json({ total: enrollments.length, enrollments });
  } catch (err) {
    next(err);
  }
};