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