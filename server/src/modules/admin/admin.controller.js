// src/modules/admin/admin.controller.js
import * as adminService from './admin.service.js';

export const getPendingApplications = async (req, res, next) => {
  try {
    const applications = await adminService.getPendingApplications();
    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewApplication = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { decision, adminNotes } = req.body;

    if (!decision) {
      const error = new Error('Vui lòng cung cấp quyết định (approve/reject).');
      error.statusCode = 400;
      throw error;
    }

    const result = await adminService.reviewApplication(
      targetUserId,
      decision,
      adminNotes
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    // Chạy song song các service để tối ưu tốc độ
    const [counts, topCourses, categoryStats] = await Promise.all([
      adminService.getDashboardCounts(),
      adminService.getTopCourses(5), // Top 5
      adminService.getCategoryStats()
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts,
        topCourses,
        categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { type = 'year', year, month } = req.query;

    const revenueData = await adminService.getRevenueStats(type, year, month);

    res.status(200).json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    next(error);
  }
};

export const getStudents = async (req, res, next) => {
  try {
    const result = await adminService.getAllStudents(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Lấy danh sách khóa học đang chờ duyệt (Admin only)
 * @route   GET /api/courses/admin/pending
 */
export const getPendingCourses = async (req, res, next) => {
  try {
    const result = await adminService.getPendingRevisions(req.query);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy chi tiết khóa học đang chờ duyệt (Admin only)
 * @route   GET /api/courses/admin/pending/:revisionId
 */
export const getPendingCourseDetail = async (req, res, next) => {
  try {
    const { revisionId } = req.params;
    const data = await adminService.getPendingRevisionDetail(revisionId);

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Duyệt khóa học (Admin only)
 * @route   POST /api/courses/admin/approve/:revisionId
 */
export const approveCourseRevision = async (req, res, next) => {
  try {
    const { revisionId } = req.params;
    const adminId = req.user._id;

    const result = await adminService.approveRevision(revisionId, adminId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Từ chối khóa học (Admin only)
 * @route   POST /api/courses/admin/reject/:revisionId
 */
export const rejectCourseRevision = async (req, res, next) => {
  try {
    const { revisionId } = req.params;
    const { reviewMessage } = req.body;
    const adminId = req.user._id;

    if (!reviewMessage || reviewMessage.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối'
      });
    }

    const result = await adminService.rejectRevision(revisionId, reviewMessage, adminId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};