import { getStatsForInstructor, getInstructorProfile, updateInstructorProfile } from "./instructor.service.js";

/**
 * GET /api/instructor/stats
 */
export const getInstructorStats = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const stats = await getStatsForInstructor(instructorId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

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