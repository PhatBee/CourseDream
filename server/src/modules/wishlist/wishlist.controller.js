import * as wishlistService from './wishlist.service.js';

/**
 * GET /api/wishlist
 */
export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courses = await wishlistService.getWishlist(userId);

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/wishlist
 * Body: { courseId }
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      const error = new Error('');
      error.statusCode = 400;
      throw error;
    }

    const result = await wishlistService.addToWishlist(userId, courseId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/wishlist/:courseId
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    const result = await wishlistService.removeFromWishlist(userId, courseId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/wishlist
 */
export const clearWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await wishlistService.clearWishlist(userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};