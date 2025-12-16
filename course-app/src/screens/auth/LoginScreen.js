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
import { login, googleLogin, facebookLogin, reset } from '../../features/auth/authSlice';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { GOOGLE_CLIENT_ID, FACEBOOK_APP_ID } from '../../utils/config';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';

// Cần thiết cho web browser auth session
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const dispatch = useDispatch();
    const { isLoading, isError, isSuccess, message, user, banReason } = useSelector(
        (state) => state.auth
    );

    // --- GOOGLE SETUP ---
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
    });

    // --- FACEBOOK SETUP ---
    const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
        clientId: FACEBOOK_APP_ID,
    });

    // Reset state khi component mount
    useEffect(() => {
        dispatch(reset());
    }, [dispatch]);

    // Xử lý kết quả Login
    useEffect(() => {
        if (isError && banReason) {
            Alert.alert(
                'Tài khoản bị khóa',
                `Lý do: ${banReason}`,
                [{ text: 'OK', onPress: () => dispatch(reset()) }]
            );
            return;
        }

        if (isError && !banReason) {
            Alert.alert('Lỗi', message || 'Đăng nhập thất bại');
            dispatch(reset());
        }

        if (isSuccess || user) {
            Alert.alert('Thành công', 'Đăng nhập thành công!');
            // Navigate based on role
            if (user?.role === 'admin') {
                navigation.replace('AdminDashboard');
            } else if (user?.role === 'instructor') {
                navigation.replace('InstructorDashboard');
            } else {
                navigation.replace('Home');
            }
            dispatch(reset());
        }
    }, [isError, isSuccess, user, message, banReason, navigation, dispatch]);

    // Xử lý phản hồi từ Google
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            dispatch(googleLogin(id_token));
        }
    }, [response, dispatch]);

    // Xử lý phản hồi từ Facebook
    useEffect(() => {
        if (fbResponse?.type === 'success') {
            const { access_token } = fbResponse.params;
            dispatch(facebookLogin(access_token));
        }
    }, [fbResponse, dispatch]);

    const handleLogin = () => {
        if (!formData.email || !formData.password) {
            return Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
        }
        dispatch(login(formData));
    };

    const onChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
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
                    {/* Header Section */}
                    <View className="mb-10">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="self-end mb-6"
                        >
                            <Text className="text-rose-500 text-base font-medium underline">
                                Back to Home
                            </Text>
                        </TouchableOpacity>

                        <Text className="text-[44px] leading-tight font-extrabold text-gray-900 tracking-tight">
                            Sign into Your Account
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View className="space-y-7">
                        {/* Email Input */}
                        <View>
                            <Text className="mb-2 text-[15px] font-medium text-gray-900">
                                Email <Text className="text-rose-500">*</Text>
                            </Text>
                            <View className="relative">
                                <TextInput
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-[15px] text-gray-900"
                                    placeholder="Enter your email"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.email}
                                    onChangeText={(text) => onChange('email', text)}
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

                        {/* Password Input */}
                        <View>
                            <Text className="mb-2 text-[15px] font-medium text-gray-900">
                                Password <Text className="text-rose-500">*</Text>
                            </Text>
                            <View className="relative">
                                <TextInput
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-[15px] text-gray-900"
                                    placeholder="Enter your password"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.password}
                                    onChangeText={(text) => onChange('password', text)}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
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
                        </View>

                        {/* Remember Me & Forgot Password */}
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity
                                className="flex-row items-center gap-2"
                                onPress={() => setRememberMe(!rememberMe)}
                            >
                                <View
                                    className={`h-4 w-4 rounded border ${rememberMe
                                            ? 'bg-rose-500 border-rose-500'
                                            : 'bg-white border-gray-300'
                                        } items-center justify-center`}
                                >
                                    {rememberMe && (
                                        <Text className="text-white text-xs font-bold">✓</Text>
                                    )}
                                </View>
                                <Text className="text-gray-700 text-[15px]">Remember Me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text className="text-rose-500 text-[15px]">Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            className={`mt-2 w-full rounded-full py-5 flex-row items-center justify-center gap-2 ${isLoading ? 'bg-rose-400' : 'bg-rose-500'
                                }`}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text className="text-white text-lg font-semibold">Login</Text>
                                    <ArrowRight size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View className="my-9 flex-row items-center gap-6">
                        <View className="flex-1 h-px bg-gray-200" />
                        <Text className="text-sm text-gray-500">Or</Text>
                        <View className="flex-1 h-px bg-gray-200" />
                    </View>

                    {/* Social Login Buttons */}
                    <View className="mb-8 gap-3">
                        {/* Google Login */}
                        <TouchableOpacity
                            className="flex-row items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-3 px-5"
                            onPress={() => promptAsync()}
                            disabled={!request || isLoading}
                        >
                            <View className="w-5 h-5 bg-blue-500 rounded-full" />
                            <Text className="text-gray-700 text-sm font-medium">
                                Continue with Google
                            </Text>
                        </TouchableOpacity>

                        {/* Facebook Login */}
                        <TouchableOpacity
                            className="flex-row items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-3 px-5"
                            onPress={() => fbPromptAsync()}
                            disabled={!fbRequest || isLoading}
                        >
                            <View className="w-5 h-5 bg-blue-600 rounded-full" />
                            <Text className="text-gray-700 text-sm font-medium">
                                Continue with Facebook
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sign Up Link */}
                    <View className="flex-row justify-center items-center mb-10">
                        <Text className="text-sm text-gray-600">Don't you have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text className="text-rose-500 text-sm font-medium">Sign up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;