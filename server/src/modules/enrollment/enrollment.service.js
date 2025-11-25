import Enrollment from "./enrollment.model.js";

export const getMyEnrollments = async (userId) => {
  return Enrollment.find({ student: userId })
    .populate("course", "title slug thumbnail price")
    .sort({ enrolledAt: -1 });
};