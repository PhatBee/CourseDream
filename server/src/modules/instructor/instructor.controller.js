import { getStatsForInstructor } from "./instructor.service.js";

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