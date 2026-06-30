import { getInstructorProfile, updateInstructorProfile, getInstructorDashboardStats, getCourseStudents as getCourseStudentsService } from "./instructor.service.js";

/**
 * GET /api/instructor/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const profile = await getInstructorProfile(req.user._id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/instructor/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const updatedProfile = await updateInstructorProfile(req.user._id, req.body);
    res.json({ success: true, message: "Cập nhật hồ sơ giảng viên thành công!", data: updatedProfile });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/instructor/dashboard
 */
export const getInstructorDashboard = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const stats = await getInstructorDashboardStats(instructorId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/instructor/courses/:courseId/students
 */
export const getCourseStudents = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { page, limit } = req.query;
    const instructorId = req.user._id;
    const result = await getCourseStudentsService(courseId, instructorId, { page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};