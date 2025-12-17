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
import { verifyResetOTP, reset } from '../../features/auth/authSlice';
import { ArrowRight, Mail } from 'lucide-react-native';

const VerifyResetOTPScreen = ({ navigation }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);

    const dispatch = useDispatch();
    const { isLoading, isError, message, isVerifyResetSuccess, resetEmail } = useSelector(
        (state) => state.auth
    );

    // Nếu không có email, đá về trang ForgotPassword
    useEffect(() => {
        if (!resetEmail) {
            Alert.alert('Thông báo', 'Vui lòng bắt đầu từ trang Quên mật khẩu.');
            navigation.navigate('ForgotPassword');
        }
    }, [resetEmail, navigation]);

    // Xử lý kết quả
    useEffect(() => {
        if (isError) {
            Alert.alert('Lỗi', message || 'Xác thực thất bại');
            dispatch(reset());
        }

        // Khi verifyResetOTP() thành công
        if (isVerifyResetSuccess && message) {
            Alert.alert('Thành công', message);
            dispatch(reset());
            navigation.navigate('SetPassword'); // Chuyển sang trang đặt mật khẩu
        }
    }, [isError, isVerifyResetSuccess, message, navigation, dispatch]);

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

        dispatch(verifyResetOTP({ email: resetEmail, otp: otpString }));
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
                                Back
                            </Text>
                        </TouchableOpacity>

                        <Text className="text-[44px] leading-tight font-extrabold text-gray-900 tracking-tight">
                            Verify OTP
                        </Text>
                        <View className="flex-row items-center mt-4 bg-rose-50 p-4 rounded-2xl">
                            <Mail size={20} color="#f43f5e" />
                            <Text className="text-gray-700 ml-2 flex-1">
                                We've sent a 6-digit code to{' '}
                                <Text className="font-bold">{resetEmail || 'your email'}</Text>
                            </Text>
                        </View>
                    </View>

                    {/* OTP Input */}
                    <View className="mb-8">
                        <Text className="mb-4 text-[15px] font-medium text-gray-900 text-center">
                            Enter OTP Code
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
                                <Text className="text-white text-lg font-semibold">Verify</Text>
                                <ArrowRight size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Info Box */}
                    <View className="mt-8 p-4 bg-gray-50 rounded-2xl">
                        <Text className="text-gray-600 text-sm text-center">
                            💡 Check your spam folder if you don't see the email in your inbox
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default VerifyResetOTPScreen;
