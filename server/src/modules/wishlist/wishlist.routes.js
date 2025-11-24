import express from 'express';
import * as wishlistController from './wishlist.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

/**
 * @route   GET /api/wishlist
 * @desc    Xem danh sách yêu thích
 */
router.get('/', wishlistController.getWishlist);

/**
 * @route   POST /api/wishlist
 * @desc    Thêm vào danh sách yêu thích
 */
router.post('/', wishlistController.addToWishlist);

/**
 * @route   DELETE /api/wishlist/:courseId
 * @desc    Xóa 1 khóa học khỏi wishlist
 */
router.delete('/:courseId', wishlistController.removeFromWishlist);

/**
 * @route   DELETE /api/wishlist
 * @desc    Xóa tất cả wishlist
 */
router.delete('/', wishlistController.clearWishlist);

export default router;