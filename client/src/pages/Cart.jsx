import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { getCart, removeFromCart, clearCart } from "../features/cart/cartSlice";
import cartService from "../features/cart/cartService";
import { toast } from "react-hot-toast";
import { Trash2, ShoppingBag, ArrowLeft, Star } from "lucide-react";
import Spinner from "../components/common/Spinner";

const formatPrice = (price) => {
    if (price === 0) return 'FREE';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export default function Cart() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { items, totalItems, totalPrice, isLoading } = useSelector((state) => state.cart);

    useEffect(() => {
        if (user) {
            // Chỉ load lần đầu hoặc khi chưa có items (tùy logic, ở đây load lại để đảm bảo giá đúng)
            dispatch(getCart());
        }
    }, [user, dispatch]);

    // 2. Cập nhật hàm xóa 1 item
    const handleRemove = (courseId) => {
        try {
            // Gọi Redux action, UI sẽ tự cập nhật khi action fulfilled
            // Không set isLoading toàn trang nên không bị nháy
            dispatch(removeFromCart(courseId));
        } catch (error) {
            toast.error("Xóa khóa học thất bại");
        }
    };

    // 3. Cập nhật hàm xóa toàn bộ
    const handleClearCart = () => {
        try {
            dispatch(clearCart());
        } catch (error) {
            toast.error("Xóa giỏ hàng thất bại");
        }

    };

    const handleCheckout = () => {
        if (items.length === 0) {
            toast.error("Giỏ hàng trống");
            return;
        }
        // TODO: Navigate to checkout page
        toast.info("Chức năng thanh toán đang được phát triển");
    };

    if (!user) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Vui lòng đăng nhập
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Bạn cần đăng nhập để xem giỏ hàng
                    </p>
                    <Link
                        to="/login"
                        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Đăng nhập
                    </Link>
                </div>
            </div>
        );
    }

    // Chỉ hiện spinner khi load trang lần đầu (getCart)
    // Các thao tác xóa/thêm sẽ không kích hoạt isLoading này nếu ta không cấu hình trong slice
    if (isLoading && items.length === 0) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!isLoading && items.length === 0) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        Giỏ hàng trống
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Hãy thêm khóa học vào giỏ hàng để bắt đầu học tập!
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                    >
                        <ArrowLeft size={20} />
                        Khám phá khóa học
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full py-12 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Cart Items */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-xl shadow-md border">
                            {/* Header */}
                            <div className="flex justify-between items-center border-b pb-4 mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Giỏ hàng của bạn
                                    <span className="text-blue-600 ml-2">({totalItems})</span>
                                </h2>
                                {items.length > 0 && (
                                    <button
                                        onClick={handleClearCart}
                                        className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Xóa tất cả
                                    </button>
                                )}
                            </div>

                            {/* Cart Items */}
                            <div className="space-y-6">
                                {items.map((item) => {
                                    const course = item.course;
                                    if (!course) return null;

                                    return (
                                        <div
                                            key={item._id}
                                            className="flex flex-col md:flex-row gap-4 pb-6 border-b last:border-b-0"
                                        >
                                            {/* Thumbnail */}
                                            <div className="md:w-48 flex-shrink-0">
                                                <Link to={`/courses/${course.slug}`}>
                                                    <img
                                                        src={course.thumbnail || 'https://via.placeholder.com/300x200'}
                                                        className="rounded-lg w-full h-32 object-cover hover:opacity-90 transition-opacity"
                                                        alt={course.title}
                                                    />
                                                </Link>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    {/* Instructor */}
                                                    {course.instructor && (
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <img
                                                                src={course.instructor.avatar || 'https://via.placeholder.com/40'}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                                alt={course.instructor.name}
                                                            />
                                                            <p className="text-sm text-gray-600">
                                                                {course.instructor.name}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Title */}
                                                    <Link to={`/courses/${course.slug}`}>
                                                        <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                                                            {course.title}
                                                        </h3>
                                                    </Link>

                                                    {/* Categories */}
                                                    {course.categories && course.categories.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {course.categories.map((cat) => (
                                                                <span
                                                                    key={cat._id}
                                                                    className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                                                                >
                                                                    {cat.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Price and Remove */}
                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-xl font-bold text-gray-800">
                                                            {formatPrice(item.priceDiscount)}
                                                        </h4>
                                                        {item.price > item.priceDiscount && (
                                                            <span className="text-sm text-gray-500 line-through">
                                                                {formatPrice(item.price)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemove(course._id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa khỏi giỏ hàng"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-md border sticky top-24">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b">
                                Tổng quan đơn hàng
                            </h3>

                            {/* Summary Details */}
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Số khóa học:</span>
                                    <span className="font-semibold">{totalItems}</span>
                                </div>

                                {/* Calculate subtotal and discount */}
                                {(() => {
                                    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
                                    const discount = subtotal - totalPrice;

                                    return (
                                        <>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Tạm tính:</span>
                                                <span className="font-semibold">{formatPrice(subtotal)}</span>
                                            </div>

                                            {discount > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Giảm giá:</span>
                                                    <span className="font-semibold">-{formatPrice(discount)}</span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-800">Tổng cộng:</span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {formatPrice(totalPrice)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            <button
                                onClick={handleCheckout}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg mb-3"
                            >
                                Thanh toán
                            </button>

                            {/* Continue Shopping */}
                            <Link
                                to="/"
                                className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                Tiếp tục mua sắm
                            </Link>

                            {/* Info */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>Lưu ý:</strong> Giá có thể thay đổi. Vui lòng kiểm tra kỹ trước khi thanh toán.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
