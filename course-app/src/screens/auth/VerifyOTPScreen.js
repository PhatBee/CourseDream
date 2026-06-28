import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOTP, reset } from '../../features/auth/authSlice';
import { ArrowRight, Mail } from 'lucide-react-native';

const VerifyOTPScreen = ({ navigation }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);

    const dispatch = useDispatch();
    const { isLoading, isError, message, isVerifySuccess, registrationEmail } = useSelector(
        (state) => state.auth
    );

    // Nếu không có email (ví dụ: user tự gõ /verify-otp), đá về trang đăng ký
    useEffect(() => {
        if (!registrationEmail) {
            Alert.alert('Thông báo', 'Vui lòng đăng ký trước.');
            navigation.navigate('Register');
        }
    }, [registrationEmail, navigation]);

    // Xử lý kết quả Verify OTP
    useEffect(() => {
        if (isError) {
            Alert.alert('Lỗi', message || 'Xác thực thất bại');
            dispatch(reset());
        }

        // Khi verifyOTP() thành công
        if (isVerifySuccess && message) {
            Alert.alert('Thành công', message, [
                {
                    text: 'OK',
                    onPress: () => {
                        dispatch(reset());
                        navigation.navigate('Login'); // Chuyển sang trang đăng nhập
                    },
                },
            ]);
        }
    }, [isError, isVerifySuccess, message, navigation, dispatch]);

    const handleOtpChange = (value, index) => {
        // Chỉ cho phép nhập số
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        // Handle backspace
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = () => {
        const otpString = otp.join('');

        if (otpString.length !== 6) {
            return Alert.alert('Thông báo', 'Mã OTP phải có 6 chữ số');
        }

        dispatch(verifyOTP({ email: registrationEmail, otp: otpString }));
    };

    const handleResend = () => {
        Alert.alert('Thông báo', 'Chức năng gửi lại OTP đang được phát triển');
        // TODO: Implement resend OTP
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 px-6 pt-12 pb-8">
                    {/* Header */}
                    <View className="mb-10">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="self-end mb-6"
                        >
                            <Text className="text-rose-500 text-base font-medium underline">
                                Quay lại
                            </Text>
                        </TouchableOpacity>

                        <Text className="text-[44px] leading-tight font-extrabold text-gray-900 tracking-tight">
                            Xác nhận email
                        </Text>
                        <View className="flex-row items-center mt-4 bg-rose-50 p-4 rounded-2xl">
                            <Mail size={20} color="#f43f5e" />
                            <Text className="text-gray-700 ml-2 flex-1">
                                Chúng tôi đã gửi mã 6 chữ số đến{' '}
                                <Text className="font-bold">{registrationEmail || 'email của bạn'}</Text>
                            </Text>
                        </View>
                    </View>

                    {/* OTP Input */}
                    <View className="mb-8">
                        <Text className="mb-4 text-[15px] font-medium text-gray-900 text-center">
                            Nhập mã OTP
                        </Text>
                        <View className="flex-row justify-between gap-2">
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => (inputRefs.current[index] = ref)}
                                    className="flex-1 aspect-square rounded-2xl border-2 border-gray-200 bg-white text-center text-2xl font-bold text-gray-900 focus:border-rose-500"
                                    value={digit}
                                    onChangeText={(value) => handleOtpChange(value, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    editable={!isLoading}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Verify Button */}
                    <TouchableOpacity
                        className={`w-full rounded-full py-5 flex-row items-center justify-center gap-2 ${isLoading ? 'bg-rose-400' : 'bg-rose-500'
                            }`}
                        onPress={handleVerify}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text className="text-white text-lg font-semibold">Xác thực</Text>
                                <ArrowRight size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Resend Link */}
                    <View className="flex-row justify-center items-center mt-8">
                        <Text className="text-sm text-gray-600">Không nhận được mã? </Text>
                        <TouchableOpacity onPress={handleResend} disabled={isLoading}>
                            <Text className="text-rose-500 text-sm font-medium">Gửi lại</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Info Box */}
                    <View className="mt-8 p-4 bg-gray-50 rounded-2xl">
                        <Text className="text-gray-600 text-sm text-center">
                            Kiểm tra thư mục spam nếu không thấy email
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default VerifyOTPScreen;
