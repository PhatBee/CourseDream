import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getCart } from "../features/cart/cartSlice";
import cartService from "../features/cart/cartService";
import paymentService from "../features/payment/paymentService";
import {
  ShoppingBag,
  ArrowLeft,
  Trash2,
  CreditCard,
  Wallet,
  Gift,
  CheckCircle,
} from "lucide-react";
import Spinner from "../components/common/Spinner";
import {
  fetchAvailablePromotions,
  previewPromotionThunk,
  clearPreview,
} from "../features/promotion/promotionSlice";

const formatPrice = (price) => {
  // Ép kiểu về số để đảm bảo so sánh đúng
  const amount = Number(price);
  if (price === 0) return "FREE";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const {
    items: cartItems,
    totalItems: cartTotalItems,
    totalPrice: cartTotalPrice,
    isLoading,
  } = useSelector((state) => state.cart);
  const { available, availableLoading } = useSelector(
    (state) => state.promotion
  );
  const { preview, previewLoading, previewError } = useSelector(
    (state) => state.promotion
  );

  const [selectedMethod, setSelectedMethod] = useState("vnpay");
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if this is a direct checkout from course detail
  const isDirectCheckout = location.state?.directCheckout;
  const directCourse = location.state?.course;

  // Determine which data to use
  const items =
    isDirectCheckout && directCourse
      ? [
          {
            course: directCourse,
            price: Number(directCourse.price || 0),
            priceDiscount: Number(
              directCourse.priceDiscount ?? directCourse.price ?? 0
            ), // Ưu tiên priceDiscount, nếu null/undefined thì lấy price            _id: directCourse._id
          },
        ]
      : cartItems;

  const totalItems = isDirectCheckout ? 1 : cartTotalItems;

  // let totalPrice
  // if (isDirectCheckout && directCourse) {
  //     // Nếu có priceDiscount thì dùng, nếu không dùng price, ép về Number
  //     totalPrice = Number(directCourse.priceDiscount ?? directCourse.price ?? 0);
  // } else {
  //     totalPrice = Number(cartTotalPrice);
  // }

  // --- LOGIC TÍNH TOÁN GIÁ ---
  // const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  // const discount = subtotal - totalPrice;
  // // Nếu totalPrice = 0 thì tax = 0, ngược lại tính 10%
  // const tax = totalPrice > 0 ? Math.round(totalPrice * 0.1) : 0;
  // const finalTotal = totalPrice + tax;

  // --- LOGIC TÍNH TOÁN GIÁ ---
  // Tính tổng giá gốc (chưa giảm)
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  // Tính tổng giá đã giảm (nếu có priceDiscount)
  const subtotalDiscount = items.reduce(
    (sum, item) => sum + (item.priceDiscount ?? item.price),
    0
  );
  //  Giá trị giảm từ mã khuyến mãi (nếu có)
  let promotionDiscount = 0;
  if (preview && preview.discountType === "percent") {
    promotionDiscount = subtotalDiscount * (preview.discountValue / 100);
  } else if (preview && preview.discountType === "fixed") {
    promotionDiscount = preview.discountValue;
  }
  // 3. Số tiền sau khi áp dụng mã giảm giá
  let amountAfterPromo = subtotalDiscount - promotionDiscount;
  if (amountAfterPromo < 0) amountAfterPromo = 0;
  // Tính discount (giảm giá so với giá gốc)
  const discount = subtotal - amountAfterPromo;
  // Nếu displayedPrice = 0 thì tax = 0, ngược lại tính 10%
  const tax = amountAfterPromo > 0 ? Math.round(amountAfterPromo * 0.1) : 0;
  // Tổng cuối cùng
  let finalTotal = amountAfterPromo + tax;

  // Làm tròn lên 1000 nếu > 0 và < 1000
  if (finalTotal > 0 && finalTotal < 1000) {
    finalTotal = 1000;
  }
  // --- LOGIC 1 & 2: Xử lý hiển thị phương thức thanh toán ---

  const isFreeOrder = finalTotal === 0;
  const isSmallAmount = finalTotal > 0 && finalTotal < 5000;

  useEffect(() => {
    if (user && !isDirectCheckout) {
      dispatch(getCart());
    }
  }, [user, dispatch, isDirectCheckout]);

  // Tự động chuyển sang MoMo nếu số tiền nhỏ
  useEffect(() => {
    if (isSmallAmount) {
      setSelectedMethod("momo");
    }
  }, [isSmallAmount]);

  // Redirect if no items (only for cart mode)
  useEffect(() => {
    if (!isDirectCheckout && !isLoading && items.length === 0) {
      toast.error("Giỏ hàng trống");
      navigate("/cart");
    }
  }, [items, isLoading, navigate, isDirectCheckout]);

  // Lấy courseIds từ cart hoặc direct checkout
  const courseIds =
    isDirectCheckout && directCourse
      ? [directCourse._id]
      : items.map((item) => item.course._id);

  useEffect(() => {
    dispatch(fetchAvailablePromotions(courseIds));
  }, [dispatch, courseIds.join(",")]);

  // Xử lý Ghi danh miễn phí
  const handleFreeEnrollment = async () => {
    setIsProcessing(true);
    try {
      const courseIds = items.map((item) => item.course._id);

      await paymentService.createFreeEnrollment({
        amount: 0,
        courseIds: courseIds,
      });

      toast.success("Ghi danh thành công!");
      // Cập nhật lại giỏ hàng (về 0)
      if (!isDirectCheckout) dispatch(getCart());

      // Chuyển hướng
      navigate("/enrolled-courses"); // Hoặc trang PaymentReturn tuỳ bạn
    } catch (error) {
      console.error("Free enrollment error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi ghi danh");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveItem = async (courseId) => {
    if (isDirectCheckout) return;
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

    setIsProcessing(true);

    try {
      // Prepare order info
      const courseNames = items.map((item) => item.course.title).join(", ");
      const orderInfo = `Thanh toan khoa hoc: ${courseNames.substring(0, 100)}`;
      const courseIds = items.map((item) => item.course._id);

      let paymentData;

      if (selectedMethod === "vnpay") {
        if (isSmallAmount) {
          toast.error("VNPAY yêu cầu thanh toán tối thiểu 5.000 VND");
          setIsProcessing(false);
          return;
        }
        toast.loading("Đang chuyển hướng đến VNPAY...");
        paymentData = await paymentService.createVNPayPayment({
          amount: finalTotal,
          orderInfo: orderInfo,
          courseIds: courseIds,
          platform: "web",
        });
      } else if (selectedMethod === "momo") {
        // === LOGIC MOMO ===
        toast.loading("Đang chuyển hướng đến MoMo...");
        paymentData = await paymentService.createMomoPayment({
          amount: finalTotal,
          orderInfo: orderInfo,
          courseIds: courseIds,
          platform: "web",
        });
      } else if (selectedMethod === "zalopay") {
        // === LOGIC ZALOPAY ===
        toast.loading("Đang chuyển hướng đến ZaloPay...");
        paymentData = await paymentService.createZaloPayPayment({
          amount: finalTotal,
          orderInfo: orderInfo,
          courseIds: courseIds,
          platform: "web",
        });
      } else {
        toast("Phương thức thanh toán này đang bảo trì");
        return;
      }

      if (paymentData && paymentData.paymentUrl) {
        // Redirect
        window.location.href = paymentData.paymentUrl;
      } else {
        toast.dismiss();
        toast.error("Lỗi khi tạo liên kết thanh toán");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi xử lý thanh toán");
      setIsProcessing(false);
    }
  };

  // Khi user chọn mã
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const handleSelectPromotion = (promo) => {
    setSelectedPromotion(promo.code);
    dispatch(
      previewPromotionThunk({ code: promo.code, courseId: courseIds[0] })
    );
  };

  const handleRemovePromotion = () => {
    setSelectedPromotion(null);
    dispatch(clearPreview());
  };

  if (!user) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Vui lòng đăng nhập
          </h3>
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập để thanh toán</p>
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

  if (isLoading && !isDirectCheckout) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const paymentMethods = [
    {
      id: "vnpay",
      label: "VNPAY",
      icon: "./VNPAY.svg",
      description: "Thanh toán qua VNPAY",
      disabled: isSmallAmount,
    },
    {
      id: "momo",
      label: "MoMo",
      icon: "./MOMO.svg",
      description: "Ví điện tử MoMo",
      disabled: false,
    },
    {
      id: "zalopay",
      label: "ZaloPay",
      icon: "./ZaloPay.svg",
      description: "Ví điện tử ZaloPay",
      disabled: false,
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
            {/* LOGIC HIỂN THỊ UI DỰA TRÊN GIÁ TRỊ ĐƠN HÀNG */}
            {isFreeOrder ? (
              /* UI CHO ĐƠN HÀNG 0Đ */
              <div className="bg-white p-8 rounded-xl shadow-md border border-green-100 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <Gift className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Tin vui! Không cần thanh toán.
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Chiết khấu hoặc ưu đãi CourseDream của bạn sẽ chi trả toàn bộ
                  cho giao dịch mua này. Ghi danh ngay để bắt đầu học.
                </p>
                <button
                  onClick={handleFreeEnrollment}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto disabled:opacity-70"
                >
                  {isProcessing ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                  Ghi danh ngay
                </button>
              </div>
            ) : (
              /* UI CHO ĐƠN HÀNG CÓ PHÍ */
              <div className="bg-white p-6 rounded-xl shadow-md border">
                <div className="flex items-center gap-2 mb-6">
                  <Wallet className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Phương thức thanh toán
                  </h2>
                </div>

                {isSmallAmount && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    Do tổng thanh toán dưới 5.000đ, chỉ hỗ trợ thanh toán qua{" "}
                    <strong>Ví MoMo hoặc ZaloPay</strong>.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() =>
                        !method.disabled && setSelectedMethod(method.id)
                      }
                      disabled={method.disabled}
                      className={`p-4 border-2 rounded-xl transition-all duration-200 relative
                                                ${
                                                  selectedMethod === method.id
                                                    ? "border-blue-500 bg-blue-50 shadow-md"
                                                    : "border-gray-200"
                                                }
                                                ${
                                                  method.disabled
                                                    ? "opacity-50 cursor-not-allowed bg-gray-50 grayscale"
                                                    : "hover:border-blue-300 cursor-pointer"
                                                }
                                            `}
                    >
                      <div className="text-center">
                        <img
                          src={method.icon}
                          alt={method.label}
                          className="w-8 h-8 mb-2 mx-auto block"
                        />
                        <p className="font-semibold text-gray-800 mb-1">
                          {method.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {method.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Payment Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>🔒 Bảo mật:</strong> Thông tin thanh toán của bạn
                    được mã hóa và bảo mật tuyệt đối.
                  </p>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={items.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <CreditCard size={20} />
                  )}
                  Thanh toán {formatPrice(finalTotal)}
                </button>
              </div>
            )}

            {/* User Info */}
            <div className="bg-white p-6 rounded-xl shadow-md border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Thông tin người mua
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || "https://via.placeholder.com/40"}
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
                        src={
                          course.thumbnail || "https://via.placeholder.com/80"
                        }
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
                    <span className="font-medium">
                      -{formatPrice(discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Thuế VAT (10%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">
                      Tổng thanh toán
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Promo Code Section */}
              {/* <div className="my-4">
                                <label className="block text-sm font-medium mb-1">Chọn mã giảm giá</label>
                                <div className="flex flex-wrap gap-2">
                                    {availableLoading && <span>Đang tải...</span>}
                                    {available.map((promo) => (
                                        <button
                                            key={promo._id}
                                            className={`px-3 py-2 rounded border ${selectedPromotion === promo.code ? "bg-rose-600 text-white border-rose-600" : "bg-white border-gray-300 text-gray-700"} hover:bg-rose-50 transition`}
                                            onClick={() => handleSelectPromotion(promo)}
                                            type="button"
                                            disabled={previewLoading}
                                        >
                                            <b>{promo.code}</b> - {promo.discountType === "percent" ? `${promo.discountValue}%` : `${promo.discountValue.toLocaleString("vi-VN")}₫`}
                                        </button>
                                    ))}
                                    {selectedPromotion && (
                                        <button
                                            className="px-3 py-2 rounded border bg-gray-200 text-gray-700 hover:bg-gray-300"
                                            onClick={handleRemovePromotion}
                                            type="button"
                                        >
                                            Bỏ mã
                                        </button>
                                    )}
                                </div>
                                {preview && (
                                    <div className="mt-2 text-green-600">
                                        Đã áp dụng mã <b>{selectedPromotion}</b>!<br />
                                        {preview.discountValue > 0 && (
                                            <span className="ml-2 text-xs text-gray-500">
                                                (Đã giảm {preview.discountValue.toLocaleString("vi-VN")}
                                                {preview.discountType === "percent" ? "%" : "₫"})
                                            </span>
                                        )}
                                    </div>
                                )}
                                {previewError && (
                                    <div className="mt-2 text-red-600">{previewError}</div>
                                )}
                            </div> */}

              {/* Info */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  💡 <strong>Lưu ý:</strong> Sau khi thanh toán thành công, bạn
                  sẽ có quyền truy cập vĩnh viễn vào các khóa học đã mua.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
