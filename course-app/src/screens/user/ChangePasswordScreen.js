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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword, reset, getProfile } from '../../features/user/userSlice';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react-native';

const ChangePasswordScreen = ({ navigation }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch]);

    const { isLoading, isError, isSuccess, message, profile } = useSelector((state) => state.user);

    console.log(profile);

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [strength, setStrength] = useState(0);

    // Kiểm tra user có password chưa
    const hasPassword = profile?.data?.hasPassword === true;

    // Tính độ mạnh mật khẩu
    const calculateStrength = (password) => {
        let score = 0;
        if (!password) return 0;
        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        return score;
    };

    // Update strength khi password thay đổi
    useEffect(() => {
        setStrength(calculateStrength(formData.newPassword));
    }, [formData.newPassword]);

    // Xử lý kết quả
    useEffect(() => {
        if (isError && message) {
            Alert.alert('Error', message);
            dispatch(reset());
        }
        if (isSuccess && message) {
            Alert.alert('Success', message, [
                {
                    text: 'OK',
                    onPress: () => {
                        setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                        dispatch(reset());
                        navigation.goBack();
                    },
                },
            ]);
        }
    }, [isError, isSuccess, message, dispatch, navigation]);

    const handleSubmit = () => {
        if (formData.newPassword !== formData.confirmPassword) {
            return Alert.alert('Error', 'Passwords do not match!');
        }

        if (strength < 2) {
            return Alert.alert('Error', 'Password is too weak!');
        }

        if (hasPassword && !formData.oldPassword) {
            return Alert.alert('Error', 'Please enter your current password!');
        }

        dispatch(
            changePassword({
                oldPassword: hasPassword ? formData.oldPassword : null,
                newPassword: formData.newPassword,
            })
        );
    };

    const getStrengthColor = () => {
        switch (strength) {
            case 1:
                return '#ef4444'; // red
            case 2:
                return '#f59e0b'; // yellow
            case 3:
                return '#3b82f6'; // blue
            case 4:
                return '#10b981'; // green
            default:
                return '#e5e7eb'; // gray
        }
    };

    const getStrengthText = () => {
        if (strength === 0) return 'Enter a new password.';
        if (strength === 1) return 'Weak. Add numbers or symbols.';
        if (strength === 2) return 'Medium. Add uppercase letters.';
        if (strength === 3) return 'Strong. Almost there.';
        if (strength === 4) return "Very Strong! You're good to go.";
        return '';
    };

    if (!profile && isLoading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#f43f5e" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {/* Header */}
                <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold">
                        {hasPassword ? 'Change Password' : 'Set Password'}
                    </Text>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="px-6 py-6">
                        {/* Info Card */}
                        <View className="flex-row items-start gap-3 mb-6 p-4 bg-rose-50 rounded-2xl">
                            {hasPassword ? (
                                <ShieldCheck size={24} color="#f43f5e" />
                            ) : (
                                <AlertCircle size={24} color="#f43f5e" />
                            )}
                            <View className="flex-1">
                                <Text className="text-gray-900 font-semibold mb-1">
                                    {hasPassword ? 'Security First' : 'Set Your Password'}
                                </Text>
                                <Text className="text-gray-600 text-sm">
                                    {hasPassword
                                        ? 'Use a long, random password to keep your account secure.'
                                        : 'You logged in via Social Media. Set a password to log in with email next time.'}
                                </Text>
                            </View>
                        </View>

                        {/* Form */}
                        <View className="space-y-6">
                            {/* Old Password - Chỉ hiện nếu user đã có password */}
                            {hasPassword && (
                                <View>
                                    <Text className="mb-2 text-[15px] font-medium text-gray-900">
                                        Current Password <Text className="text-rose-500">*</Text>
                                    </Text>
                                    <View className="relative">
                                        <TextInput
                                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-[15px] text-gray-900"
                                            placeholder="Enter your current password"
                                            placeholderTextColor="#9CA3AF"
                                            value={formData.oldPassword}
                                            onChangeText={(text) =>
                                                setFormData({ ...formData, oldPassword: text })
                                            }
                                            secureTextEntry={!showOldPassword}
                                            autoCapitalize="none"
                                            editable={!isLoading}
                                        />
                                        <TouchableOpacity
                                            className="absolute right-3 top-0 bottom-0 justify-center"
                                            onPress={() => setShowOldPassword(!showOldPassword)}
                                        >
                                            {showOldPassword ? (
                                                <Eye size={18} color="#9CA3AF" />
                                            ) : (
                                                <EyeOff size={18} color="#9CA3AF" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* New Password */}
                            <View>
                                <Text className="mb-2 text-[15px] font-medium text-gray-900">
                                    New Password <Text className="text-rose-500">*</Text>
                                </Text>
                                <View className="relative">
                                    <TextInput
                                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-[15px] text-gray-900"
                                        placeholder="Enter new password (min 8 chars)"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.newPassword}
                                        onChangeText={(text) =>
                                            setFormData({ ...formData, newPassword: text })
                                        }
                                        secureTextEntry={!showNewPassword}
                                        autoCapitalize="none"
                                        editable={!isLoading}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-3 top-0 bottom-0 justify-center"
                                        onPress={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? (
                                            <Eye size={18} color="#9CA3AF" />
                                        ) : (
                                            <EyeOff size={18} color="#9CA3AF" />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Password Strength Indicator */}
                                {formData.newPassword.length > 0 && (
                                    <>
                                        <View className="flex-row gap-2 mt-3">
                                            {[0, 1, 2, 3].map((index) => (
                                                <View
                                                    key={index}
                                                    className="h-1.5 flex-1 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            strength > index ? getStrengthColor() : '#e5e7eb',
                                                    }}
                                                />
                                            ))}
                                        </View>
                                        <Text
                                            className="text-xs mt-2"
                                            style={{
                                                color: strength === 4 ? '#10b981' : '#6b7280',
                                            }}
                                        >
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
                                        placeholder="Re-enter new password"
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.confirmPassword}
                                        onChangeText={(text) =>
                                            setFormData({ ...formData, confirmPassword: text })
                                        }
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
                                className={`mt-4 w-full rounded-full py-5 flex-row items-center justify-center ${isLoading ? 'bg-rose-400' : 'bg-rose-500'
                                    }`}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white text-lg font-semibold">
                                        {hasPassword ? 'Change Password' : 'Set Password'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChangePasswordScreen;
