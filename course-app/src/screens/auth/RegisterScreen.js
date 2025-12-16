import React, { useState } from 'react';
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
import { Mail, Lock, User, ArrowRight } from 'lucide-react-native';

const RegisterScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const onChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRegister = () => {
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            return Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
        }

        if (formData.password !== formData.confirmPassword) {
            return Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
        }

        // TODO: Implement register logic
        Alert.alert('Thông báo', 'Chức năng đăng ký đang được phát triển');
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
                            Create Account
                        </Text>
                        <Text className="text-gray-600 mt-2 text-base">
                            Sign up to get started
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="space-y-6">
                        {/* Name */}
                        <View>
                            <Text className="mb-2 text-[15px] font-medium text-gray-900">
                                Full Name <Text className="text-rose-500">*</Text>
                            </Text>
                            <View className="relative">
                                <TextInput
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-[15px] text-gray-900"
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.name}
                                    onChangeText={(text) => onChange('name', text)}
                                    editable={!isLoading}
                                />
                                <View className="absolute right-3 top-0 bottom-0 justify-center">
                                    <User size={18} color="#9CA3AF" />
                                </View>
                            </View>
                        </View>

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

                        {/* Password */}
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
                                    secureTextEntry
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                                <View className="absolute right-3 top-0 bottom-0 justify-center">
                                    <Lock size={18} color="#9CA3AF" />
                                </View>
                            </View>
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
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => onChange('confirmPassword', text)}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                                <View className="absolute right-3 top-0 bottom-0 justify-center">
                                    <Lock size={18} color="#9CA3AF" />
                                </View>
                            </View>
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            className={`mt-4 w-full rounded-full py-5 flex-row items-center justify-center gap-2 ${isLoading ? 'bg-rose-400' : 'bg-rose-500'
                                }`}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text className="text-white text-lg font-semibold">Sign Up</Text>
                                    <ArrowRight size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Login Link */}
                    <View className="flex-row justify-center items-center mt-8">
                        <Text className="text-sm text-gray-600">Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text className="text-rose-500 text-sm font-medium">Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default RegisterScreen;
