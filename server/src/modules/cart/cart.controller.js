import cartService from './cart.service.js';

class CartController {
    /**
     * GET /api/cart
     * Lấy giỏ hàng của user hiện tại
     */
    async getCart(req, res) {
        try {
            const studentId = req.user._id;
            const cart = await cartService.getCart(studentId);

            res.status(200).json({
                success: true,
                data: cart
            });
        } catch (error) {
            console.error('Error getting cart:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi khi lấy giỏ hàng'
            });
        }
    }

    /**
     * POST /api/cart/add
     * Thêm course vào giỏ hàng
     */
    async addToCart(req, res) {
        try {
            const studentId = req.user._id;
            const { courseId } = req.body;

            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    message: 'Yêu cầu nhập ID khóa học'
                });
            }

            const cart = await cartService.addToCart(studentId, courseId);

            res.status(200).json({
                success: true,
                message: 'Khóa học đã được thêm vào giỏ hàng',
                data: cart
            });
        } catch (error) {
            console.error('Error adding to cart:', error);

            if (error.message === 'Course not found') {
                return res.status(404).json({
                    success: false,
                    message: 'Khóa học không tồn tại'
                });
            }

            if (error.message === 'Course already in cart') {
                return res.status(400).json({
                    success: false,
                    message: 'Khóa học đã tồn tại trong giỏ hàng'
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add course to cart'
            });
        }
    }

    /**
     * DELETE /api/cart/remove/:courseId
     * Xóa course khỏi giỏ hàng
     */
    async removeFromCart(req, res) {
        try {
            const studentId = req.user._id;
            const { courseId } = req.params;

            const cart = await cartService.removeFromCart(studentId, courseId);

            res.status(200).json({
                success: true,
                message: 'Khóa học đã được xóa khỏi giỏ hàng',
                data: cart
            });
        } catch (error) {
            console.error('Error removing from cart:', error);

            if (error.message === 'Cart not found') {
                return res.status(404).json({
                    success: false,
                    message: 'Giỏ hàng không tồn tại'
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Failed to remove course from cart'
            });
        }
    }

    /**
     * DELETE /api/cart/clear
     * Xóa toàn bộ giỏ hàng
     */
    async clearCart(req, res) {
        try {
            const studentId = req.user._id;
            const cart = await cartService.clearCart(studentId);

            res.status(200).json({
                success: true,
                message: 'Giỏ hàng đã được xóa',
                data: cart
            });
        } catch (error) {
            console.error('Error clearing cart:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to clear cart'
            });
        }
    }

    /**
     * PUT /api/cart/update-prices
     * Cập nhật giá của các items trong cart
     */
    async updateCartPrices(req, res) {
        try {
            const studentId = req.user._id;
            const cart = await cartService.updateCartPrices(studentId);

            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Giỏ hàng không tồn tại'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Giá của các khóa học trong giỏ hàng đã được cập nhật',
                data: cart
            });
        } catch (error) {
            console.error('Error updating cart prices:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi khi cập nhật giá của các khóa học trong giỏ hàng'
            });
        }
    }
}

export default new CartController();
