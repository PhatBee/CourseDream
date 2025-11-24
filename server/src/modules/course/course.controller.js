// Thay đổi 'require' thành 'import'
import * as courseService from './course.service.js';
import Course from "./course.model.js";
import Lecture from "./lecture.model.js";
import Section from "./section.model.js";
import Enrollment from "../enrollment/enrollment.model.js";


/**
 * @desc    Lấy chi tiết khóa học
 * @route   GET /api/v1/courses/:slug
 */
export const getCourseDetailsBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const data = await courseService.getCourseDetailsBySlug(slug);

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getAllCourses(req.query);
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy nội dung bài học (Private)
 * @route   GET /api/v1/courses/:slug/learn
 */
export const getLearningContent = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const data = await courseService.getLearningDetails(slug, userId);

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

export const searchCourses = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "12", 10);
    const skip = (page - 1) * limit;

    const filter = q ? {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ]
    } : {};

    const [total, courses] = await Promise.all([
      Course.countDocuments(filter),
      Course.find(filter)
        .skip(skip)
        .limit(limit)
        .select("title slug thumbnail price rating studentsCount")
        .sort({ rating: -1, createdAt: -1 })
    ]);

    return res.json({ total, page, limit, courses });
  } catch (err) {
    next(err);
  }
};

export const getLecture = async (req, res, next) => {
  try {
    const { courseId, lectureId } = req.params;
    const user = req.user;

    const lecture = await Lecture.findById(lectureId).populate("section");
    if (!lecture) return res.status(404).json({ message: "Bài giảng không tồn tại" });

    const section = lecture.section ? lecture.section : await Section.findById(lecture.section);
    if (!section || section.course.toString() !== courseId.toString()) {
      return res.status(400).json({ message: "Lecture không thuộc khóa học này" });
    }

    if (lecture.isPreviewFree) return res.json({ lecture });

    if (!user) return res.status(401).json({ message: "Vui lòng đăng nhập để xem bài giảng" });

    const enrolled = await Enrollment.findOne({ student: user._id, course: courseId });
    if (!enrolled) return res.status(403).json({ message: "Bạn chưa mua khóa học này" });

    return res.json({ lecture });
  } catch (err) {
    next(err);
  }
};