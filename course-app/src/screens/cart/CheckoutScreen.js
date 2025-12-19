import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getCart } from '../../features/cart/cartSlice';
import paymentService from '../../features/payment/paymentService';
import {
    ArrowLeft,
    Wallet,
    CreditCard,
    Gift,
    CheckCircle,
    Trash2,
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
    const { items, totalItems, total, isLoading } = useSelector(
        (state) => state.cart
    );

    const [selectedMethod, setSelectedMethod] = useState('vnpay');
    const [isProcessing, setIsProcessing] = useState(false);

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

    // Calculate prices
    const subtotal = checkoutItems.reduce((sum, item) => sum + item.price, 0);
    const subtotalDiscount = checkoutItems.reduce(
        (sum, item) => sum + (item.priceDiscount ?? item.price),
        0
    );
    const discount = subtotal - subtotalDiscount;
    const tax = subtotalDiscount > 0 ? Math.round(subtotalDiscount * 0.1) : 0;
    let finalTotal = subtotalDiscount + tax;

    // Round up if < 1000
    if (finalTotal > 0 && finalTotal < 1000) {
        finalTotal = 1000;
    }

    const isFreeOrder = finalTotal === 0;
    const isSmallAmount = finalTotal > 0 && finalTotal < 5000;

    useEffect(() => {
        if (user && !isDirectCheckout) {
            dispatch(getCart());
        }
    }, [user, dispatch, isDirectCheckout]);

    // Auto-select MoMo for small amounts
    useEffect(() => {
        if (isSmallAmount) {
            setSelectedMethod('momo');
        }
    }, [isSmallAmount]);

    const handleFreeEnrollment = async () => {
        setIsProcessing(true);
        try {
            const courseIds = checkoutItems.map((item) => item.course._id);

            await paymentService.createFreeEnrollment({
                amount: 0,
                courseIds: courseIds,
            });

            Alert.alert('Success', 'Ghi danh thành công!', [
                {
                    text: 'OK',
                    onPress: () => {
                        if (!isDirectCheckout) dispatch(getCart());
                        navigation.navigate('EnrolledCourses');
                    },
                },
            ]);
        } catch (error) {
            console.error('Free enrollment error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Lỗi khi ghi danh');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayment = async () => {
        if (checkoutItems.length === 0) {
            Alert.alert('Error', 'Giỏ hàng trống');
            return;
        }

        setIsProcessing(true);

        try {
            const courseNames = checkoutItems
                .map((item) => item.course.title)
                .join(', ');
            const orderInfo = `Thanh toan khoa hoc: ${courseNames.substring(0, 100)}`;
            const courseIds = checkoutItems.map((item) => item.course._id);

            let paymentData;

            if (selectedMethod === 'vnpay') {
                if (isSmallAmount) {
                    Alert.alert('Error', 'VNPAY yêu cầu thanh toán tối thiểu 5.000 VND');
                    setIsProcessing(false);
                    return;
                }
                paymentData = await paymentService.createVNPayPayment({
                    amount: finalTotal,
                    orderInfo: orderInfo,
                    courseIds: courseIds,
                    platform: 'mobile', // Thêm platform
                });
            } else if (selectedMethod === 'momo') {
                paymentData = await paymentService.createMomoPayment({
                    amount: finalTotal,
                    orderInfo: orderInfo,
                    courseIds: courseIds,
                    platform: 'mobile',
                });
            } else if (selectedMethod === 'zalopay') {
                paymentData = await paymentService.createZaloPayPayment({
                    amount: finalTotal,
                    orderInfo: orderInfo,
                    courseIds: courseIds,
                    platform: 'mobile',
                });
            }

            if (paymentData && paymentData.paymentUrl) {
                // Navigate to WebView screen instead of opening external browser
                navigation.navigate('PaymentWebView', {
                    paymentUrl: paymentData.paymentUrl,
                    paymentMethod: selectedMethod,
                });
            } else {
                Alert.alert('Error', 'Lỗi khi tạo liên kết thanh toán');
            }
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Lỗi khi xử lý thanh toán');
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
                <View className="px-6 py-6 space-y-6">
                    {/* Payment Method Section */}
                    {isFreeOrder ? (
                        /* Free Order UI */
                        <View className="bg-white p-8 rounded-xl border border-green-100 items-center">
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
                                className={`px-8 py-3 rounded-full flex-row items-center gap-2 ${isProcessing ? 'bg-green-400' : 'bg-green-600'
                                    }`}
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
                        <View className="bg-white p-6 rounded-xl">
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

                            <View className="space-y-3 mb-6">
                                {paymentMethods.map((method) => (
                                    <TouchableOpacity
                                        key={method.id}
                                        onPress={() => !method.disabled && setSelectedMethod(method.id)}
                                        disabled={method.disabled}
                                        className={`p-4 border-2 rounded-xl ${selectedMethod === method.id
                                            ? 'border-rose-500 bg-rose-50'
                                            : 'border-gray-200'
                                            } ${method.disabled ? 'opacity-50 bg-gray-50' : ''}`}
                                    >
                                        <View className="flex-row items-center justify-between">
                                            <View>
                                                <Text className="font-semibold text-gray-800 mb-1">
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

                            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <Text className="text-sm text-blue-800">
                                    <Text className="font-bold">🔒 Bảo mật:</Text> Thông tin thanh toán của bạn được mã hóa và bảo mật tuyệt đối.
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={handlePayment}
                                disabled={checkoutItems.length === 0 || isProcessing}
                                className={`w-full py-4 rounded-lg flex-row items-center justify-center gap-2 ${isProcessing ? 'bg-rose-400' : 'bg-gradient-to-r from-rose-600 to-indigo-600'
                                    }`}
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
                                    Thanh toán
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* User Info */}
                    <View className="bg-white p-6 rounded-xl">
                        <Text className="text-lg font-semibold text-gray-800 mb-4">
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
                    <View className="bg-white p-6 rounded-xl">
                        <Text className="text-xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-100">
                            Chi tiết đơn hàng
                        </Text>

                        {/* Course Items */}
                        <View className="space-y-4 mb-6">
                            {checkoutItems.map((item) => {
                                const course = item.course;
                                if (!course) return null;

                                return (
                                    <View
                                        key={item._id}
                                        className="flex-row items-start gap-3 bg-gray-50 p-3 rounded-lg"
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
                                                {formatPrice(item.priceDiscount)}
                                            </Text>
                                            {item.price > item.priceDiscount && (
                                                <Text className="text-xs text-gray-500 line-through">
                                                    {formatPrice(item.price)}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Price Summary */}
                        <View className="space-y-3 pt-4 border-t border-gray-100">
                            <View className="flex-row justify-between text-gray-600">
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

                            <View className="flex-row justify-between">
                                <Text className="text-gray-600">Thuế VAT (10%)</Text>
                                <Text className="font-medium">{formatPrice(tax)}</Text>
                            </View>

                            <View className="border-t border-gray-100 pt-3">
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
                    </View>

                    {/* Info */}
                    <View className="bg-amber-50 border border-amber-200 rounded-lg p-4">
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
