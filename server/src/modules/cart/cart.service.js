import Cart from './cart.model.js';
import Course from '../course/course.model.js';

class CartService {
    /**
     * Lấy giỏ hàng của user
     */
    async getCart(studentId) {
        let cart = await Cart.findOne({ student: studentId })
            .populate({
                path: 'items.course',
                select: 'title slug thumbnail price priceDiscount instructor categories',
                populate: [
                    { path: 'instructor', select: 'name avatar' },
                    { path: 'categories', select: 'name slug' }
                ]
            });

        // Nếu chưa có cart, tạo mới
        if (!cart) {
            cart = await Cart.create({ student: studentId, items: [] });
        }

        return cart;
    }

    /**
     * Thêm course vào giỏ hàng
     */
    async addToCart(studentId, courseId) {
        // Kiểm tra course có tồn tại không
        const course = await Course.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }

        // Lấy hoặc tạo cart
        let cart = await Cart.findOne({ student: studentId });
        if (!cart) {
            cart = new Cart({ student: studentId, items: [] });
        }

        // Kiểm tra course đã có trong cart chưa
        const existingItem = cart.items.find(
            item => item.course.toString() === courseId
        );

        if (existingItem) {
            throw new Error('Course already in cart');
        }

        // Thêm course vào cart
        cart.items.push({
            course: courseId,
            price: course.price,
            priceDiscount: course.priceDiscount,
            addedAt: new Date()
        });

        // Tính toán lại totals
        cart.calculateTotals();
        await cart.save();

        // Populate và return
        return await Cart.findById(cart._id)
            .populate({
                path: 'items.course',
                select: 'title slug thumbnail price priceDiscount instructor categories',
                populate: [
                    { path: 'instructor', select: 'name avatar' },
                    { path: 'categories', select: 'name slug' }
                ]
            });
    }

    /**
     * Xóa course khỏi giỏ hàng
     */
    async removeFromCart(studentId, courseId) {
        const cart = await Cart.findOne({ student: studentId });
        if (!cart) {
            throw new Error('Cart not found');
        }

        // Lọc bỏ course
        cart.items = cart.items.filter(
            item => item.course.toString() !== courseId
        );

        // Tính toán lại totals
        cart.calculateTotals();
        await cart.save();

        // Populate và return
        return await Cart.findById(cart._id)
            .populate({
                path: 'items.course',
                select: 'title slug thumbnail price priceDiscount instructor categories',
                populate: [
                    { path: 'instructor', select: 'name avatar' },
                    { path: 'categories', select: 'name slug' }
                ]
            });
    }

    /**
     * Xóa toàn bộ giỏ hàng
     */
    async clearCart(studentId) {
        const cart = await Cart.findOne({ student: studentId });
        if (!cart) {
            throw new Error('Cart not found');
        }

        cart.items = [];
        cart.calculateTotals();
        await cart.save();

        return cart;
    }

    /**
     * Cập nhật giá của các items trong cart (nếu giá course thay đổi)
     */
    async updateCartPrices(studentId) {
        const cart = await Cart.findOne({ student: studentId });
        if (!cart) {
            return null;
        }

        // Lấy tất cả course IDs
        const courseIds = cart.items.map(item => item.course);
        const courses = await Course.find({ _id: { $in: courseIds } });

        // Tạo map để tra cứu nhanh
        const courseMap = new Map(
            courses.map(c => [c._id.toString(), c])
        );

        // Cập nhật giá
        cart.items.forEach(item => {
            const course = courseMap.get(item.course.toString());
            if (course) {
                item.price = course.price;
                item.priceDiscount = course.priceDiscount;
            }
        });

        cart.calculateTotals();
        await cart.save();

        return await Cart.findById(cart._id)
            .populate({
                path: 'items.course',
                select: 'title slug thumbnail price priceDiscount instructor categories',
                populate: [
                    { path: 'instructor', select: 'name avatar' },
                    { path: 'categories', select: 'name slug' }
                ]
            });
    }
    /**
     * Xóa danh sách các khóa học đã thanh toán khỏi giỏ hàng
     * @param {string} studentId 
     * @param {Array} courseIdsArray - Mảng các ID khóa học đã mua
     */
    async removeCoursesFromCart(studentId, courseIdsArray) {
        const cart = await Cart.findOne({ student: studentId });
        if (!cart) return;

        // Chuyển courseIdsArray về dạng string để so sánh
        const paidCourseIds = courseIdsArray.map(id => id.toString());

        console.log("payment.courses:", courseIdsArray);
        console.log("cart.items:", cart.items);

        // Lọc giữ lại những item KHÔNG nằm trong danh sách đã mua
        cart.items = cart.items.filter(
            item => !paidCourseIds.includes(item.course.toString())
        );

        cart.calculateTotals();
        await cart.save();
        return cart;
    }

}

export default new CartService();
