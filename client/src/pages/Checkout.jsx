import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getCart } from "../features/cart/cartSlice";
import cartService from "../features/cart/cartService";
import paymentService from "../features/payment/paymentService";
import { ShoppingBag, ArrowLeft, Trash2, CreditCard, Wallet } from "lucide-react";
import Spinner from "../components/common/Spinner";

const formatPrice = (price) => {
    if (price === 0) return 'FREE';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export default function Checkout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const { items: cartItems, totalItems: cartTotalItems, totalPrice: cartTotalPrice, isLoading } = useSelector((state) => state.cart);

    const [selectedMethod, setSelectedMethod] = useState("vnpay");

    // Check if this is a direct checkout from course detail
    const isDirectCheckout = location.state?.directCheckout;
    const directCourse = location.state?.course;

    // Determine which data to use
    const items = isDirectCheckout && directCourse
        ? [{
            course: directCourse,
            price: directCourse.price,
            priceDiscount: directCourse.priceDiscount,
            _id: directCourse._id
        }]
        : cartItems;

    const totalItems = isDirectCheckout ? 1 : cartTotalItems;
    const totalPrice = isDirectCheckout ? directCourse?.priceDiscount || 0 : cartTotalPrice;

    useEffect(() => {
        if (user && !isDirectCheckout) {
            dispatch(getCart());
        }
    }, [user, dispatch, isDirectCheckout]);

    // Redirect if no items (only for cart mode)
    useEffect(() => {
        if (!isDirectCheckout && !isLoading && items.length === 0) {
            toast.error("Giỏ hàng trống");
            navigate("/cart");
        }
    }, [items, isLoading, navigate, isDirectCheckout]);

    const handleRemoveItem = async (courseId) => {
        try {
            await cartService.removeFromCart(courseId);
            dispatch(getCart());
            toast.success("Đã xóa khóa học");
        } catch (error) {
            toast.error("Lỗi khi xóa khóa học");
        }
    };

    const handlePayment = async () => {
        if (items.length === 0) {
            toast.error("Giỏ hàng trống");
            return;
        }

        if (selectedMethod !== 'vnpay') {
            toast("Hiện tại chỉ hỗ trợ thanh toán qua VNPAY");
            return;
        }

        try {
            toast.loading("Đang tạo liên kết thanh toán...");

            // Calculate final amount with tax
            const subtotal = items.reduce((sum, item) => sum + item.price, 0);
            const discount = subtotal - totalPrice;
            const tax = Math.round(totalPrice * 0.1);
            const finalTotal = totalPrice + tax;

            // Prepare order info
            const courseNames = items.map(item => item.course.title).join(', ');
            const orderInfo = `Thanh toan khoa hoc: ${courseNames.substring(0, 100)}`;

            // Call API to create payment URL using paymentService
            const paymentData = await paymentService.createVNPayPayment({
                amount: finalTotal,
                orderInfo: orderInfo,
                courseIds: items.map(item => item.course._id)
            });

            if (paymentData.paymentUrl) {
                // Redirect to VNPAY
                window.location.href = paymentData.paymentUrl;
            } else {
                toast.error("Lỗi khi tạo liên kết thanh toán");
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || "Lỗi khi xử lý thanh toán");
        }
    };

    if (!user) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Vui lòng đăng nhập
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Bạn cần đăng nhập để thanh toán
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

    if (isLoading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    // Calculate subtotal and tax
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const discount = subtotal - totalPrice;
    const tax = Math.round(totalPrice * 0.1); // 10% VAT
    const finalTotal = totalPrice + tax;

    const paymentMethods = [
        {
            id: "vnpay",
            label: "VNPAY",
            icon: "./VNPAY.svg",
            description: "Thanh toán qua VNPAY"
        },
        {
            id: "momo",
            label: "MoMo",
            icon: "./MOMO.svg",
            description: "Ví điện tử MoMo"
        },
        {
            id: "zalopay",
            label: "ZaloPay",
            icon: "./ZaloPay.svg",
            description: "Ví điện tử ZaloPay"
        },
    ];

    return (
        <div className="w-full py-12 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4">
                {/* Breadcrumb */}
                <div className="mb-6">
                    {isDirectCheckout && directCourse ? (
                        <Link
                            to={`/courses/${directCourse.slug}`}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            Quay lại trang khóa học
                        </Link>
                    ) : (
                        <Link
                            to="/cart"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            Quay lại giỏ hàng
                        </Link>
                    )}
                </div>

                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Thanh toán</h1>
                    <p className="text-gray-600">Hoàn tất đơn hàng của bạn</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT CONTENT - Payment Method */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Method Selection */}
                        <div className="bg-white p-6 rounded-xl shadow-md border">
                            <div className="flex items-center gap-2 mb-6">
                                <Wallet className="w-6 h-6 text-blue-600" />
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Phương thức thanh toán
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-md
                      ${selectedMethod === method.id
                                                ? "border-blue-500 bg-blue-50 shadow-md"
                                                : "border-gray-200 hover:border-blue-300"
                                            }
                    `}
                                    >
                                        <div className="text-center">
                                            <img src={method.icon} alt={method.label} className="w-8 h-8 mb-2 mx-auto block" />
                                            <p className="font-semibold text-gray-800 mb-1">{method.label}</p>
                                            <p className="text-xs text-gray-500">{method.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Payment Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-blue-800">
                                    <strong>🔒 Bảo mật:</strong> Thông tin thanh toán của bạn được mã hóa và bảo mật tuyệt đối.
                                </p>
                            </div>

                            {/* Payment Button */}
                            <button
                                onClick={handlePayment}
                                disabled={items.length === 0}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <CreditCard size={20} />
                                Thanh toán {formatPrice(finalTotal)}
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="bg-white p-6 rounded-xl shadow-md border">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Thông tin người mua
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.avatar || 'https://via.placeholder.com/40'}
                                        alt={user.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-800">{user.name}</p>
                                        <p className="text-sm text-gray-600">{user.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-md border sticky top-24">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-4 border-b">
                                Chi tiết đơn hàng
                            </h2>

                            {/* Course Items */}
                            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                                {items.map((item) => {
                                    const course = item.course;
                                    if (!course) return null;

                                    return (
                                        <div
                                            key={item._id}
                                            className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg relative group"
                                        >
                                            <img
                                                src={course.thumbnail || 'https://via.placeholder.com/80'}
                                                alt={course.title}
                                                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-800 line-clamp-2 mb-1">
                                                    {course.title}
                                                </p>
                                                <p className="text-blue-600 font-semibold">
                                                    {formatPrice(item.priceDiscount)}
                                                </p>
                                                {item.price > item.priceDiscount && (
                                                    <p className="text-xs text-gray-500 line-through">
                                                        {formatPrice(item.price)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Only show remove button in cart mode */}
                                            {!isDirectCheckout && (
                                                <button
                                                    onClick={() => handleRemoveItem(course._id)}
                                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Price Summary */}
                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tạm tính ({totalItems} khóa học)</span>
                                    <span className="font-medium">{formatPrice(subtotal)}</span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Giảm giá</span>
                                        <span className="font-medium">-{formatPrice(discount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-gray-600">
                                    <span>Thuế VAT (10%)</span>
                                    <span className="font-medium">{formatPrice(tax)}</span>
                                </div>

                                <div className="border-t pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-800">Tổng thanh toán</span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {formatPrice(finalTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-800">
                                    💡 <strong>Lưu ý:</strong> Sau khi thanh toán thành công, bạn sẽ có quyền truy cập vĩnh viễn vào các khóa học đã mua.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
