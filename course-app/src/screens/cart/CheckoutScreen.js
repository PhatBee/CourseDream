import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getCart } from '../../features/cart/cartSlice';
import paymentService from '../../features/payment/paymentService';
import {
    fetchAvailablePromotions,
    previewPromotionThunk,
    clearPreview,
    fetchTieredPreview,
    setForceCoupon,
} from '../../features/promotion/promotionSlice';
import {
    ArrowLeft,
    Wallet,
    CreditCard,
    Gift,
    CheckCircle,
} from 'lucide-react-native';

const formatPrice = (price) => {
    if (price === 0) return 'FREE';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

const CheckoutScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { items, totalItems, isLoading } = useSelector(
        (state) => state.cart
    );
    const {
        available,
        availableLoading,
        preview,
        previewLoading,
        previewError,
        tieredPreview,
        tieredLoading,
        forceCoupon,
    } = useSelector((state) => state.promotion);

    const [selectedMethod, setSelectedMethod] = useState('vnpay');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState(null);
    const [hasAutoSelected, setHasAutoSelected] = useState(false);

    // Check if direct checkout
    const isDirectCheckout = route.params?.directCheckout;
    const directCourse = route.params?.course;

    // Determine data to use
    const checkoutItems = isDirectCheckout && directCourse
        ? [{
            course: directCourse,
            price: Number(directCourse.price || 0),
            priceDiscount: Number(directCourse.priceDiscount ?? directCourse.price ?? 0),
            _id: directCourse._id,
        }]
        : items;

    const checkoutTotalItems = isDirectCheckout ? 1 : totalItems;

    // --- LOGIC TÍNH TOÁN GIÁ (giống web) ---
    const subtotal = checkoutItems.reduce((sum, item) => sum + item.price, 0);
    const subtotalDiscount = checkoutItems.reduce(
        (sum, item) => sum + (item.priceDiscount ?? item.price),
        0
    );

    const tieredDiscount = tieredPreview?.totalTieredDiscount || 0;
    const couponDiscount = preview?.discountAmount || 0;

    // Tự động chọn ưu đãi cao hơn hoặc theo forceCoupon
    const appliedDiscount = forceCoupon
        ? couponDiscount
        : Math.max(tieredDiscount, couponDiscount);

    // Xác định loại ưu đãi đang áp dụng
    const activeDiscountType = forceCoupon
        ? (couponDiscount > 0 ? 'coupon' : 'none')
        : (tieredDiscount >= couponDiscount && tieredDiscount > 0 ? 'tiered' : (couponDiscount > 0 ? 'coupon' : 'none'));

    let amountAfterPromo = subtotalDiscount - appliedDiscount;
    if (amountAfterPromo < 0) amountAfterPromo = 0;

    const discount = subtotal - amountAfterPromo;
    const tax = amountAfterPromo > 0 ? Math.round(amountAfterPromo * 0.1) : 0;
    let finalTotal = amountAfterPromo + tax;

    // Làm tròn lên 1000 nếu > 0 và < 1000
    if (finalTotal > 0 && finalTotal < 1000) {
        finalTotal = 1000;
    }

    const isFreeOrder = finalTotal === 0;
    const isSmallAmount = finalTotal > 0 && finalTotal < 5000;

    // Lấy courseIds
    const courseIds = isDirectCheckout && directCourse
        ? [directCourse._id]
        : checkoutItems.map((item) => item.course?._id).filter(Boolean);

    // Fetch cart và reset promo khi mount
    useEffect(() => {
        dispatch(clearPreview());
        dispatch(setForceCoupon(false));
        if (user && !isDirectCheckout) {
            dispatch(getCart());
        }
    }, [user, dispatch, isDirectCheckout]);

    // Fetch available promotions và tiered preview
    useEffect(() => {
        if (courseIds.length > 0) {
            dispatch(fetchAvailablePromotions(courseIds));
            dispatch(fetchTieredPreview(courseIds));
        }
    }, [dispatch, courseIds.join(',')]);

    // Auto-select MoMo for small amounts
    useEffect(() => {
        if (isSmallAmount) {
            setSelectedMethod('momo');
        }
    }, [isSmallAmount]);

    // Auto-select mã giảm giá tốt nhất (giống web)
    useEffect(() => {
        if (!availableLoading && !tieredLoading && available.length > 0 && !hasAutoSelected) {
            let bestPromo = null;
            let maxDiscount = 0;

            available.forEach((promo) => {
                let estimatedDiscount = 0;
                if (promo.discountType === 'percent') {
                    estimatedDiscount = (subtotalDiscount * promo.discountValue) / 100;
                    if (promo.maxDiscount && estimatedDiscount > promo.maxDiscount) {
                        estimatedDiscount = promo.maxDiscount;
                    }
                } else {
                    estimatedDiscount = promo.discountValue;
                }

                if (estimatedDiscount > maxDiscount) {
                    maxDiscount = estimatedDiscount;
                    bestPromo = promo;
                }
            });

            const currentTieredDiscount = tieredPreview?.totalTieredDiscount || 0;

            // Chọn mã nếu nó cao hơn Tiered Discount
            if (bestPromo && maxDiscount > currentTieredDiscount) {
                if (!selectedPromotion) {
                    handleSelectPromotion(bestPromo);
                }
            }

            setHasAutoSelected(true);
        }
    }, [available, availableLoading, tieredLoading, hasAutoSelected, subtotalDiscount, tieredPreview]);

    const handleSelectPromotion = (promo) => {
        if (selectedPromotion === promo.code) {
            handleRemovePromotion();
        } else {
            setSelectedPromotion(promo.code);
            dispatch(previewPromotionThunk({ code: promo.code, courseIds }));
        }
    };

    const handleRemovePromotion = () => {
        setSelectedPromotion(null);
        dispatch(clearPreview());
        dispatch(setForceCoupon(false));
    };

    const handleFreeEnrollment = async () => {
        setIsProcessing(true);
        try {
            await paymentService.createFreeEnrollment({
                amount: 0,
                courseIds: courseIds,
                couponCode: selectedPromotion,
                forceCoupon: forceCoupon,
            });

            Alert.alert('Thành công', 'Ghi danh thành công!', [
                {
                    text: 'OK',
                    onPress: () => {
                        if (!isDirectCheckout) dispatch(getCart());
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
                        setTimeout(() => {
                            navigation.navigate('EnrolledCourses');
                        }, 100);
                    },
                },
            ]);
        } catch (error) {
            console.error('Free enrollment error:', error);
            Alert.alert('Lỗi', error.response?.data?.message || 'Lỗi khi ghi danh');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayment = async () => {
        if (checkoutItems.length === 0) {
            Alert.alert('Lỗi', 'Giỏ hàng trống');
            return;
        }

        setIsProcessing(true);

        try {
            const courseNames = checkoutItems
                .map((item) => item.course.title)
                .join(', ');
            const orderInfo = `Thanh toan khoa hoc: ${courseNames.substring(0, 100)}`;

            let paymentData;

            if (selectedMethod === 'vnpay') {
                if (isSmallAmount) {
                    Alert.alert('Lỗi', 'VNPAY yêu cầu thanh toán tối thiểu 5.000 VND');
                    setIsProcessing(false);
                    return;
                }
                paymentData = await paymentService.createVNPayPayment({
                    amount: finalTotal,
                    orderInfo: orderInfo,
                    courseIds: courseIds,
                    platform: 'mobile',
                    couponCode: selectedPromotion,
                    forceCoupon: forceCoupon,
                });
            } else if (selectedMethod === 'momo') {
                paymentData = await paymentService.createMomoPayment({
                    amount: finalTotal,
                    orderInfo: orderInfo,
                    courseIds: courseIds,
                    platform: 'mobile',
                    couponCode: selectedPromotion,
                    forceCoupon: forceCoupon,
                });
            } else if (selectedMethod === 'zalopay') {
                paymentData = await paymentService.createZaloPayPayment({
                    amount: finalTotal,
                    orderInfo: orderInfo,
                    courseIds: courseIds,
                    platform: 'mobile',
                    couponCode: selectedPromotion,
                    forceCoupon: forceCoupon,
                });
            }

            if (paymentData && paymentData.paymentUrl) {
                navigation.navigate('PaymentWebView', {
                    paymentUrl: paymentData.paymentUrl,
                    paymentMethod: selectedMethod,
                });
            } else {
                Alert.alert('Lỗi', 'Lỗi khi tạo liên kết thanh toán');
            }
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert('Lỗi', error.response?.data?.message || 'Lỗi khi xử lý thanh toán');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <CreditCard size={64} color="#9ca3af" />
                <Text className="text-xl font-semibold text-gray-800 mt-4 mb-2">
                    Vui lòng đăng nhập
                </Text>
                <Text className="text-gray-600 mb-4">
                    Bạn cần đăng nhập để thanh toán
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                    className="px-6 py-2 bg-rose-600 rounded-lg"
                >
                    <Text className="text-white font-semibold">Đăng nhập</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (isLoading && !isDirectCheckout) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#f43f5e" />
            </SafeAreaView>
        );
    }

    const paymentMethods = [
        {
            id: 'vnpay',
            label: 'VNPAY',
            description: 'Thanh toán qua VNPAY',
            disabled: isSmallAmount,
        },
        {
            id: 'momo',
            label: 'MoMo',
            description: 'Ví điện tử MoMo',
            disabled: false,
        },
        {
            id: 'zalopay',
            label: 'ZaloPay',
            description: 'Ví điện tử ZaloPay',
            disabled: false,
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="mr-4"
                >
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <View>
                    <Text className="text-xl font-bold">Thanh toán</Text>
                    <Text className="text-sm text-gray-500">Hoàn tất đơn hàng</Text>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-3 py-2 space-y-3">
                    {/* User Info */}
                    <View className="bg-white p-3 rounded-xl">
                        <Text className="text-lg font-semibold text-gray-800 mb-3">
                            Thông tin người mua
                        </Text>
                        <View className="flex-row items-center gap-3">
                            <Image
                                source={{
                                    uri: user.avatar || 'https://i.pravatar.cc/150?img=3',
                                }}
                                className="w-12 h-12 rounded-full"
                            />
                            <View>
                                <Text className="font-semibold text-gray-800">{user.name}</Text>
                                <Text className="text-sm text-gray-600">{user.email}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Order Summary */}
                    <View className="bg-white p-3 rounded-xl">
                        <Text className="text-xl font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                            Chi tiết đơn hàng
                        </Text>

                        {/* Course Items */}
                        <View className="space-y-3 mb-4">
                            {checkoutItems.map((item) => {
                                const course = item.course;
                                if (!course) return null;

                                const basePriceDiscount = item.priceDiscount ?? item.price;

                                // Tìm discount theo từng item giống web
                                const itemCouponPromo = preview?.itemDiscounts?.find(d => d.courseId === course._id);
                                const itemTieredPromo = tieredPreview?.items?.find(d =>
                                    d.course._id === course._id || d.course === course._id
                                );

                                let currentPrice = basePriceDiscount;
                                let discountBadge = null;
                                let isPromoBg = false;

                                if (activeDiscountType === 'coupon' && itemCouponPromo) {
                                    currentPrice = itemCouponPromo.discountedPrice;
                                    isPromoBg = true;
                                    discountBadge = (
                                        <View className="self-start mt-1 px-2 py-0.5 bg-green-100 rounded-full">
                                            <Text className="text-green-700 text-[10px] font-bold">
                                                - {formatPrice(itemCouponPromo.discountAmount)} (Mã giảm giá)
                                            </Text>
                                        </View>
                                    );
                                } else if (activeDiscountType === 'tiered' && itemTieredPromo && itemTieredPromo.tieredDiscountAmount > 0) {
                                    currentPrice = itemTieredPromo.tieredFinalPrice;
                                    isPromoBg = true;
                                    discountBadge = (
                                        <View className="self-start mt-1 px-2 py-0.5 bg-rose-100 rounded-full border border-rose-200">
                                            <Text className="text-rose-700 text-[10px] font-bold">
                                                - {itemTieredPromo.tieredDiscountPercentage}% (Khách hàng thân thiết)
                                            </Text>
                                        </View>
                                    );
                                }

                                return (
                                    <View
                                        key={item._id}
                                        className={`flex-row items-start gap-3 p-3 rounded-lg border ${
                                            isPromoBg
                                                ? (activeDiscountType === 'coupon'
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-rose-50 border-rose-200')
                                                : 'bg-gray-50 border-transparent'
                                        }`}
                                    >
                                        <Image
                                            source={{
                                                uri: course.thumbnail || 'https://via.placeholder.com/80',
                                            }}
                                            className="w-20 h-20 rounded-lg"
                                        />
                                        <View className="flex-1">
                                            <Text className="font-medium text-sm text-gray-800 mb-1" numberOfLines={2}>
                                                {course.title}
                                            </Text>
                                            <Text className="text-rose-600 font-semibold">
                                                {formatPrice(currentPrice)}
                                            </Text>
                                            {item.price > currentPrice && (
                                                <Text className="text-xs text-gray-500 line-through">
                                                    {formatPrice(item.price)}
                                                </Text>
                                            )}
                                            {discountBadge}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Price Summary */}
                        <View className="space-y-3 pt-3 border-t border-gray-100">
                            <View className="flex-row justify-between">
                                <Text className="text-gray-600">Tạm tính ({checkoutTotalItems} khóa học)</Text>
                                <Text className="font-medium">{formatPrice(subtotal)}</Text>
                            </View>

                            {discount > 0 && (
                                <View className="flex-row justify-between">
                                    <Text className="text-green-600">Giảm giá</Text>
                                    <Text className="font-medium text-green-600">
                                        -{formatPrice(discount)}
                                    </Text>
                                </View>
                            )}

                            <View className="flex-row justify-between pb-3">
                                <Text className="text-gray-600">Thuế VAT (10%)</Text>
                                <Text className="font-medium">{formatPrice(tax)}</Text>
                            </View>

                            <View className="border-t border-gray-100 pt-4">
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-lg font-bold text-gray-800">
                                        Tổng thanh toán
                                    </Text>
                                    <Text className="text-2xl font-bold text-rose-600">
                                        {formatPrice(finalTotal)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Promo Code Section */}
                        <View className="mt-6 pt-4 border-t border-gray-100">

                            {/* Banner Tiered Discount - giống web */}
                            {tieredPreview && tieredPreview.totalTieredDiscount > 0 && (
                                <View className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                                    <View className="flex-row items-start gap-3">
                                        <View className="p-2 bg-rose-100 rounded-full mt-0.5">
                                            <Gift size={20} color="#e11d48" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-bold text-gray-800 mb-1">
                                                Chiết khấu khách hàng thân thiết
                                            </Text>
                                            <Text className="text-sm text-gray-600 leading-5">
                                                Bạn đã sở hữu <Text className="font-bold">{tieredPreview.previousValidCount}</Text> khóa học phù hợp chính sách. Mua thêm hôm nay được áp dụng chính sách giảm giá thân thiết.
                                            </Text>
                                            <Text className="text-sm font-semibold text-rose-600 mt-2">
                                                Tiết kiệm: -{formatPrice(tieredPreview.totalTieredDiscount)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Conflict Resolution Banner - giống web */}
                            {preview && tieredPreview && tieredPreview.totalTieredDiscount > 0 && (
                                <View className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    {couponDiscount > tieredDiscount ? (
                                        <View>
                                            <Text className="font-medium text-blue-800 mb-1">
                                                Đang dùng mã giảm giá vì có ưu đãi tốt hơn!
                                            </Text>
                                            <Text className="text-blue-800 text-sm">
                                                Mã khuyến mãi giảm nhiều hơn chiết khấu thân thiết, hệ thống đã tự động chọn mức giảm tốt nhất cho bạn.
                                            </Text>
                                        </View>
                                    ) : (
                                        <View>
                                            <Text className="font-medium text-blue-800 mb-1">
                                                Đang dùng chiết khấu thân thiết!
                                            </Text>
                                            <Text className="text-blue-800 text-sm mb-2">
                                                Chiết khấu mua nhiều khóa học của bạn đang có ưu đãi tốt hơn mã giảm giá này.
                                            </Text>
                                            {!forceCoupon ? (
                                                <TouchableOpacity onPress={() => dispatch(setForceCoupon(true))}>
                                                    <Text className="text-blue-600 font-semibold underline text-sm">
                                                        Bỏ qua chiết khấu thân thiết (Dùng mã coupon thay thế)
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity onPress={() => dispatch(setForceCoupon(false))}>
                                                    <Text className="text-blue-600 font-semibold underline text-sm">
                                                        Quay lại dùng chiết khấu thân thiết
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}

                            <Text className="text-sm font-bold text-gray-800 mb-3">Mã khuyến mãi</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {availableLoading && (
                                    <View className="flex-row items-center gap-2">
                                        <ActivityIndicator size="small" color="#6b7280" />
                                        <Text className="text-gray-500 text-sm">Đang tìm mã giảm giá...</Text>
                                    </View>
                                )}
                                {available?.map((promo) => {
                                    const isSelected = selectedPromotion === promo.code;
                                    return (
                                        <TouchableOpacity
                                            key={promo._id}
                                            onPress={() => handleSelectPromotion(promo)}
                                            disabled={previewLoading}
                                            className={`px-4 py-2 rounded-xl border-2 mb-2 ${
                                                isSelected
                                                    ? 'bg-rose-600 border-rose-600'
                                                    : 'bg-white border-gray-200'
                                            }`}
                                        >
                                            <Text className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                                                {promo.code}{' '}
                                                <Text className={isSelected ? 'text-rose-200' : 'text-gray-400'}>•</Text>
                                                {' '}Giảm {promo.discountType === 'percent' ? `${promo.discountValue}%` : `${promo.discountValue.toLocaleString('vi-VN')}₫`}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {previewError && (
                                <View className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <Text className="text-red-600 text-sm">{previewError}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Payment Method Section */}
                    {isFreeOrder ? (
                        /* Free Order UI */
                        <View className="bg-white p-8 rounded-xl border border-green-100 items-center mt-4">
                            <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
                                <Gift size={32} color="#16a34a" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
                                Tin vui! Không cần thanh toán.
                            </Text>
                            <Text className="text-gray-600 mb-6 text-center">
                                Chiết khấu hoặc ưu đãi CourseDream của bạn sẽ chi trả toàn bộ cho giao dịch mua này.
                            </Text>
                            <TouchableOpacity
                                onPress={handleFreeEnrollment}
                                disabled={isProcessing}
                                className={`px-8 py-3 rounded-full flex-row items-center gap-2 ${isProcessing ? 'bg-green-400' : 'bg-green-600'}`}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <CheckCircle size={20} color="#fff" />
                                )}
                                <Text className="text-white font-semibold">Ghi danh ngay</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* Paid Order UI */
                        <View className="bg-white p-6 rounded-xl mt-4">
                            <View className="flex-row items-center gap-2 mb-6">
                                <Wallet size={24} color="#FB7185" />
                                <Text className="text-xl font-semibold text-gray-800">
                                    Phương thức thanh toán
                                </Text>
                            </View>

                            {isSmallAmount && (
                                <View className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <Text className="text-sm text-amber-800">
                                        Do tổng thanh toán dưới 5.000đ, chỉ hỗ trợ thanh toán qua{' '}
                                        <Text className="font-bold">Ví MoMo hoặc ZaloPay</Text>.
                                    </Text>
                                </View>
                            )}

                            <View className="space-y-4 mb-8">
                                {paymentMethods.map((method) => (
                                    <TouchableOpacity
                                        key={method.id}
                                        onPress={() => !method.disabled && setSelectedMethod(method.id)}
                                        disabled={method.disabled}
                                        className={`p-5 border-2 rounded-xl ${selectedMethod === method.id
                                            ? 'border-rose-500 bg-rose-50'
                                            : 'border-gray-200'
                                            } ${method.disabled ? 'opacity-50 bg-gray-50' : ''}`}
                                    >
                                        <View className="flex-row items-center justify-between">
                                            <View>
                                                <Text className="font-semibold text-gray-800 mb-1 text-base">
                                                    {method.label}
                                                </Text>
                                                <Text className="text-xs text-gray-500">
                                                    {method.description}
                                                </Text>
                                            </View>
                                            {selectedMethod === method.id && (
                                                <View className="w-5 h-5 rounded-full bg-rose-500 items-center justify-center">
                                                    <View className="w-2 h-2 rounded-full bg-white" />
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-8">
                                <Text className="text-sm text-rose-800">
                                    <Text className="font-bold">Bảo mật:</Text> Thông tin thanh toán của bạn được mã hóa và bảo mật tuyệt đối.
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={handlePayment}
                                disabled={checkoutItems.length === 0 || isProcessing}
                                className={`w-full py-4 rounded-lg flex-row items-center justify-center gap-2`}
                                style={{
                                    backgroundColor: isProcessing ? '#FDA4AF' : '#FB7185',
                                }}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <CreditCard size={20} color="#fff" />
                                )}
                                <Text className="text-white font-semibold text-lg text-center">
                                    Thanh toán {formatPrice(finalTotal)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Info */}
                    <View className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-2 mb-2">
                        <Text className="text-sm text-amber-800">
                            💡 <Text className="font-bold">Lưu ý:</Text> Sau khi thanh toán thành công, bạn sẽ có quyền truy cập vĩnh viễn vào các khóa học đã mua.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CheckoutScreen;
