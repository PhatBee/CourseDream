import * as progressService from './progress.service.js';

export const getProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseSlug } = req.params;

    const progress = await progressService.getCourseProgress(userId, courseSlug);

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleLectureCompletion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseSlug, lectureId } = req.body;

    if (!courseSlug || !lectureId) {
        const error = new Error('Thiếu courseSlug hoặc lectureId');
        error.statusCode = 400;
        throw error;
    }

    const result = await progressService.toggleLectureCompletion(userId, courseSlug, lectureId);

    res.status(200).json({
      success: true,
      message: 'Cập nhật tiến độ thành công',
      data: result, // Trả về progress mới nhất để frontend cập nhật UI
    });
  } catch (error) {
    next(error);
  }
};