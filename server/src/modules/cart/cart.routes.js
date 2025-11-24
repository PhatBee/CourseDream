import express from 'express';
import cartController from './cart.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { addToCartValidation, removeFromCartValidation } from './cart.validation.js';
import { validationResult } from 'express-validator';

const router = express.Router();

// Middleware để check validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Tất cả routes đều yêu cầu authentication
router.use(verifyToken);

/**
 * @route   GET /api/cart
 * @desc    Lấy giỏ hàng của user hiện tại
 * @access  Private
 */
router.get('/', cartController.getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Thêm course vào giỏ hàng
 * @access  Private
 */
router.post('/add', addToCartValidation, handleValidationErrors, cartController.addToCart);

/**
 * @route   DELETE /api/cart/remove/:courseId
 * @desc    Xóa course khỏi giỏ hàng
 * @access  Private
 */
router.delete('/remove/:courseId', removeFromCartValidation, handleValidationErrors, cartController.removeFromCart);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Xóa toàn bộ giỏ hàng
 * @access  Private
 */
router.delete('/clear', cartController.clearCart);

/**
 * @route   PUT /api/cart/update-prices
 * @desc    Cập nhật giá của các items trong cart (nếu giá course thay đổi)
 * @access  Private
 */
router.put('/update-prices', cartController.updateCartPrices);

export default router;
