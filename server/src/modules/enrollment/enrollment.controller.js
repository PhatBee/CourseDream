import enrollmentService from "./enrollment.service.js";

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

export const getStudentDashboard = async (req, res) => {
  try {
    const dashboardData = await enrollmentService.getStudentDashboard(req.user.id);
    res.status(200).json({ success: true, data: dashboardData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};