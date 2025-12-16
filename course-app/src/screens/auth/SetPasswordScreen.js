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
import { setPassword, clearReset, reset } from '../../features/auth/authSlice';
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';

const SetPasswordScreen = ({ navigation }) => {
    const [password, setPasswordValue] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const dispatch = useDispatch();
    const { isLoading, isError, isSetPasswordSuccess, message, resetToken } = useSelector(
        (state) => state.auth
    );

    // Nếu không có token, không cho ở lại trang này
    useEffect(() => {
        if (!resetToken) {
            Alert.alert('Lỗi', 'Phiên đặt lại mật khẩu không hợp lệ.');
            navigation.navigate('ForgotPassword');
        }
    }, [resetToken, navigation]);

    // Xử lý kết quả
    useEffect(() => {
        if (isError) {
            Alert.alert('Lỗi', message || 'Đặt lại mật khẩu thất bại');
            dispatch(reset());
        }

        // Khi setPassword() thành công
        if (isSetPasswordSuccess) {
            Alert.alert('Thành công', message, [
                {
                    text: 'OK',
                    onPress: () => {
                        dispatch(clearReset()); // Xóa state (token, email)
                        navigation.navigate('Login'); // Về trang đăng nhập
                    },
                },
            ]);
        }
    }, [isError, isSetPasswordSuccess, message, navigation, dispatch]);

    // Đánh giá độ mạnh mật khẩu
    const getStrength = () => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score; // 0..4
    };
    const strength = getStrength();

    const getStrengthText = () => {
        if (strength === 0) return 'Use at least 8 characters';
        if (strength === 1) return 'Weak password';
        if (strength === 2) return 'Fair password';
        if (strength === 3) return 'Strong password';
        if (strength === 4) return 'Very strong password';
        return '';
    };

    const getStrengthColor = () => {
        if (strength === 0) return '#e5e7eb';
        if (strength === 1) return '#ef4444';
        if (strength === 2) return '#f59e0b';
        if (strength === 3) return '#10b981';
        if (strength === 4) return '#059669';
        return '#e5e7eb';
    };

    const handleSubmit = () => {
        if (!password) {
            return Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu mới');
        }

        if (password.length < 6) {
            return Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
        }

        if (password !== confirmPassword) {
            return Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
        }

        dispatch(setPassword({ resetToken, password }));
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
                            Set New Password
                        </Text>
                        <Text className="text-gray-600 mt-2 text-base">
                            Your new password must be different from previous password
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="space-y-6">
                        {/* New Password */}
                        <View>
                            <Text className="mb-2 text-[15px] font-medium text-gray-900">
                                New Password <Text className="text-rose-500">*</Text>
                            </Text>
                            <View className="relative">
                                <TextInput
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-[15px] text-gray-900"
                                    placeholder="Enter new password"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPasswordValue}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    className="absolute right-3 top-0 bottom-0 justify-center"
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <Eye size={18} color="#9CA3AF" />
                                    ) : (
                                        <EyeOff size={18} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Strength bar */}
                            {password.length > 0 && (
                                <>
                                    <View className="mt-3 flex-row gap-2">
                                        {[0, 1, 2, 3].map((i) => (
                                            <View
                                                key={i}
                                                className="h-2 flex-1 rounded"
                                                style={{
                                                    backgroundColor: strength > i ? getStrengthColor() : '#e5e7eb',
                                                }}
                                            />
                                        ))}
                                    </View>
                                    <Text className="mt-2 text-xs text-gray-600">
                                        {getStrengthText()}
                                    </Text>
                                </>
                            )}
                        </View>

                        {/* Confirm Password */}
                        <View>
                            <Text className="mb-2 text-[15px] font-medium text-gray-900">
                                Confirm Password <Text className="text-rose-500">*</Text>
                            </Text>
                            <View className="relative">
                                <TextInput
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-[15px] text-gray-900"
                                    placeholder="Confirm your password"
                                    placeholderTextColor="#9CA3AF"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    className="absolute right-3 top-0 bottom-0 justify-center"
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <Eye size={18} color="#9CA3AF" />
                                    ) : (
                                        <EyeOff size={18} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
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
                                    <Text className="text-white text-lg font-semibold">Reset Password</Text>
                                    <ArrowRight size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
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

export default SetPasswordScreen;
