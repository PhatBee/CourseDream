import React, { useState, useEffect } from 'react';
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
import { forgotPassword, reset } from '../../features/auth/authSlice';
import { Mail, ArrowRight } from 'lucide-react-native';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');

    const dispatch = useDispatch();
    const { isLoading, isError, message, isForgotSuccess } = useSelector(
        (state) => state.auth
    );

    // Xử lý kết quả
    useEffect(() => {
        if (isError) {
            Alert.alert('Lỗi', message || 'Gửi yêu cầu thất bại');
            dispatch(reset());
        }

        // Khi forgotPassword() thành công
        if (isForgotSuccess) {
            Alert.alert('Thành công', message); // "Mã OTP đã được gửi..."
            dispatch(reset());
            navigation.navigate('VerifyResetOTP'); // Chuyển sang trang nhập OTP
        }
    }, [isError, isForgotSuccess, message, navigation, dispatch]);

    const handleSubmit = () => {
        if (!email) {
            return Alert.alert('Thông báo', 'Vui lòng nhập email');
        }

        dispatch(forgotPassword(email));
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
                                Back to Login
                            </Text>
                        </TouchableOpacity>

                        <Text className="text-[44px] leading-tight font-extrabold text-gray-900 tracking-tight">
                            Forgot Password?
                        </Text>
                        <Text className="text-gray-600 mt-2 text-base">
                            Enter your email to reset your password
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="space-y-6">
                        {/* Email */}
                        <View>
                            <Text className="mb-2 text-[15px] font-medium text-gray-900">
                                Email <Text className="text-rose-500">*</Text>
                            </Text>
                            <View className="relative">
                                <TextInput
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-[15px] text-gray-900"
                                    placeholder="Enter your email"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                />
                                <View className="absolute right-3 top-0 bottom-0 justify-center">
                                    <Mail size={18} color="#9CA3AF" />
                                </View>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            className={`mt-4 w-full rounded-full py-5 flex-row items-center justify-center gap-2 ${isLoading ? 'bg-rose-400' : 'bg-rose-500'
                                }`}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text className="text-white text-lg font-semibold">Submit</Text>
                                    <ArrowRight size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Info Box */}
                    <View className="mt-8 p-4 bg-rose-50 rounded-2xl">
                        <Text className="text-gray-700 text-sm text-center">
                            We'll send you an email with instructions to reset your password
                        </Text>
                    </View>

                    {/* Login Link */}
                    <View className="flex-row justify-center items-center mt-8">
                        <Text className="text-sm text-gray-600">Remember Password? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text className="text-rose-500 text-sm font-medium">Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default ForgotPasswordScreen;
