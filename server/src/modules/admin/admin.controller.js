// src/modules/admin/admin.controller.js
import * as adminService from './admin.service.js';

/**
 * Helper: Đặt httpOnly cookies cho access & refresh token
 */
const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 14 * 24 * 60 * 60 * 1000,
    });
};

/**
 * @desc    Đăng nhập dành riêng cho Admin (chỉ local auth)
 * @route   POST /api/admin/login
 * @access  Public
 */
export const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await adminService.loginAdmin({ email, password });
        setCookies(res, accessToken, refreshToken);
        res.status(200).json({
            message: 'Đăng nhập quản trị thành công!',
            user,
            accessToken,
            refreshToken,
        });
    } catch (error) {
        next(error);
    }
};

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


export const getInstructors = async (req, res, next) => {
  try {
    const result = await adminService.getAllInstructors(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleBlockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const result = await adminService.toggleBlockUser(userId, reason);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { isActive: result.isActive, banReason: result.banReason }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get instructor applications
 * @route   GET /api/admin/instructors/applications
 */
export const getInstructorApplications = async (req, res, next) => {
    try {
        const result = await adminService.getInstructorApplications(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Review application (Approve/Reject)
 * @route   POST /api/admin/instructors/applications/:id/review
 */
export const reviewInstructorApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body; // action: 'approve' | 'reject'

        const result = await adminService.reviewInstructorApplication(id, action, reason);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        next(error);
    }
};

// ======================== COURSE STATUS MANAGEMENT ========================

/**
 * CASE 3: Yêu cầu Instructor chỉnh sửa
 * @route   PATCH /api/admin/revisions/:revisionId/request-changes
 */
export const requestRevisionChanges = async (req, res, next) => {
  try {
    const { revisionId } = req.params;
    const { reviewMessage } = req.body;
    const adminId = req.user._id;

    if (!reviewMessage || !reviewMessage.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập phản hồi chi tiết cho instructor.' });
    }

    const result = await adminService.requestRevisionChanges(revisionId, reviewMessage, adminId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

/**
 * CASE 7: Unpublish khóa học
 * @route   PATCH /api/admin/courses/:courseId/unpublish
 */
export const unpublishCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    const result = await adminService.unpublishCourse(courseId, adminId, reason);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

/**
 * CASE 8: Suspend khóa học (vi phạm chính sách)
 * @route   PATCH /api/admin/courses/:courseId/suspend
 */
export const suspendCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do đình chỉ.' });
    }

    const result = await adminService.suspendCourse(courseId, adminId, reason);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore khóa học từ suspended
 * @route   PATCH /api/admin/courses/:courseId/restore
 */
export const restoreSuspendedCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const adminId = req.user._id;

    const result = await adminService.restoreSuspendedCourse(courseId, adminId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

/**
 * Publish lại khóa học từ unpublished → published
 * @route   PATCH /api/admin/courses/:courseId/republish
 */
export const republishCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const adminId = req.user._id;

    const result = await adminService.republishCourse(courseId, adminId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách tất cả courses (có filter status) cho Admin quản lý
 * @route   GET /api/admin/courses
 */
export const getAllCourses = async (req, res, next) => {
  try {
    const result = await adminService.getAllCoursesForAdmin(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin xem preview tất cả Quiz trong một khóa học (để kiểm duyệt)
 * @route   GET /api/admin/courses/:courseId/quizzes-preview
 */
export const getQuizzesPreview = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const result = await adminService.getQuizzesPreview(courseId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
