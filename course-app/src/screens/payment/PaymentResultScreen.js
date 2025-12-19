import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { getCart } from '../../features/cart/cartSlice';
import { CheckCircle, XCircle, Home } from 'lucide-react-native';

const PaymentResultScreen = ({ navigation, route }) => {
    const { queryString } = route.params;
    const dispatch = useDispatch();

    const [isLoading, setIsLoading] = useState(true);
    const [paymentResult, setPaymentResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        processPaymentResult();
    }, []);

    const processPaymentResult = async () => {
        try {
            setIsLoading(true);

            // Parse query params from URL
            const params = new URLSearchParams(queryString);

            const success = params.get('success');
            const message = params.get('message');
            const method = params.get('method');
            const orderId = params.get('orderId');
            const amount = params.get('amount');

            if (!success) {
                setError('Không tìm thấy thông tin giao dịch.');
                setPaymentResult({ success: false, message: 'Không tìm thấy thông tin giao dịch.' });
                return;
            }

            const result = {
                success: success === 'true',
                message: message || (success === 'true' ? 'Thanh toán thành công!' : 'Thanh toán thất bại'),
                data: {
                    orderId,
                    amount,
                    method
                }
            };

            setPaymentResult(result);

            // Refresh cart if payment successful
            if (result.success) {
                dispatch(getCart());
            }
        } catch (err) {
            console.error('Payment processing error:', err);
            setError('Có lỗi xảy ra trong quá trình xử lý.');
            setPaymentResult({ success: false, message: 'Có lỗi xảy ra trong quá trình xử lý.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoHome = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
    };

    const handleViewCourses = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
        // Navigate to enrolled courses after reset
        setTimeout(() => {
            navigation.navigate('EnrolledCourses');
        }, 100);
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#f43f5e" />
                <Text className="mt-4 text-gray-600">Đang xác thực thanh toán...</Text>
            </SafeAreaView>
        );
    }

    const isSuccess = paymentResult?.success;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 items-center justify-center px-6">
                {/* Icon */}
                <View
                    className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${isSuccess ? 'bg-green-100' : 'bg-red-100'
                        }`}
                >
                    {isSuccess ? (
                        <CheckCircle size={64} color="#16a34a" />
                    ) : (
                        <XCircle size={64} color="#dc2626" />
                    )}
                </View>

                {/* Title */}
                <Text className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
                </Text>

                {/* Message */}
                <Text className="text-gray-600 text-center mb-8">
                    {paymentResult?.message || error || 'Đã xảy ra lỗi'}
                </Text>

                {/* Transaction Details */}
                {paymentResult?.data && (
                    <View className="w-full bg-gray-50 rounded-xl p-4 mb-8">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Thông tin giao dịch
                        </Text>
                        <View className="space-y-2">
                            {paymentResult.data.orderId && (
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-600">Mã đơn hàng:</Text>
                                    <Text className="font-medium">{paymentResult.data.orderId}</Text>
                                </View>
                            )}
                            {paymentResult.data.amount && (
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-600">Số tiền:</Text>
                                    <Text className="font-medium text-rose-600">
                                        {Number(paymentResult.data.amount).toLocaleString('vi-VN')} đ
                                    </Text>
                                </View>
                            )}
                            {paymentResult.data.transactionNo && (
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-600">Mã giao dịch:</Text>
                                    <Text className="font-medium">{paymentResult.data.transactionNo}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View className="w-full space-y-3">
                    {isSuccess ? (
                        <>
                            <TouchableOpacity
                                onPress={handleViewCourses}
                                className="w-full bg-rose-500 py-4 rounded-lg"
                            >
                                <Text className="text-white text-center font-semibold text-lg">
                                    Xem khóa học của tôi
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleGoHome}
                                className="w-full border-2 border-gray-300 py-4 rounded-lg flex-row items-center justify-center gap-2"
                            >
                                <Home size={20} color="#374151" />
                                <Text className="text-gray-700 font-semibold text-lg">
                                    Về trang chủ
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                className="w-full bg-rose-500 py-4 rounded-lg"
                            >
                                <Text className="text-white text-center font-semibold text-lg">
                                    Thử lại
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleGoHome}
                                className="w-full border-2 border-gray-300 py-4 rounded-lg flex-row items-center justify-center gap-2"
                            >
                                <Home size={20} color="#374151" />
                                <Text className="text-gray-700 font-semibold text-lg">
                                    Về trang chủ
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default PaymentResultScreen;
