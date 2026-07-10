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

export const activateCourse = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id || req.user._id;

    const enrollment = await enrollmentService.activateCourse(enrollmentId, userId);

    res.status(200).json({
      success: true,
      message: "Kích hoạt khóa học thành công",
      enrollment
    });
  } catch (err) {
    next(err);
  }
};

export const extendCourse = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const { packageId } = req.body; 
    const userId = req.user.id || req.user._id;

    const result = await enrollmentService.extendCourse(enrollmentId, userId, packageId);

    res.status(200).json({
      success: true,
      message: result.priceCharged === 0 
        ? `Đã gia hạn thêm ${result.weeksAdded} tuần!` 
        : `Gia hạn khóa học thành công!`,
      enrollment: result.enrollment
    });
  } catch (err) {
    next(err);
  }
};