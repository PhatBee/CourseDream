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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, reset, getProfile } from '../../features/user/userSlice';
import { ArrowLeft, Camera, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { isLoading, isError, isSuccess, message, profile } = useSelector(
        (state) => state.user
    );

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        phone: '',
    });
    const [avatarUri, setAvatarUri] = useState(null);
    const [deleteAvatar, setDeleteAvatar] = useState(false);

    // Ref để track xem người dùng đã bấm submit (gọi API) hay chưa
    // Tránh useEffect phản ứng với isSuccess/isError từ lần trước hoặc từ getProfile
    const isSubmittingRef = useRef(false);

    // ─── Load profile khi mount ───────────────────────────────────────────────
    useEffect(() => {
        // Reset flag trạng thái cũ trước khi load màn hình
        dispatch(reset());
        dispatch(getProfile());
    }, [dispatch]);

    // ─── Điền form khi profile load xong ─────────────────────────────────────
    useEffect(() => {
        if (profile?.data) {
            const user = profile.data;
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
                phone: user.phone || '',
            });
            if (!avatarUri && !deleteAvatar) {
                setAvatarUri(user.avatar);
            }
        }
    }, [profile]);

    // ─── Xử lý Alert sau khi API update trả về kết quả ───────────────────────
    // CHỈ phản ứng khi isSubmittingRef.current = true (đã bấm Submit)
    useEffect(() => {
        // Nếu chưa submit (chưa gọi API), bỏ qua mọi thay đổi isError/isSuccess
        if (!isSubmittingRef.current) return;

        if (isError && message) {
            isSubmittingRef.current = false;
            Alert.alert('Cập nhật thất bại', message);
            dispatch(reset());
        }

        if (isSuccess && message) {
            isSubmittingRef.current = false;
            Alert.alert('Thành công', message, [
                {
                    text: 'OK',
                    onPress: () => {
                        dispatch(reset());
                        dispatch(getProfile());
                        navigation.goBack();
                    },
                },
            ]);
        }
    }, [isError, isSuccess, message]);

    // ─── Chọn ảnh từ thư viện ─────────────────────────────────────────────────
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Quyền bị từ chối', 'Cần quyền truy cập thư viện ảnh!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setAvatarUri(result.assets[0].uri);
            setDeleteAvatar(false);
        }
    };

    // ─── Xóa avatar ──────────────────────────────────────────────────────────
    const handleDeleteAvatar = () => {
        Alert.alert(
            'Xóa ảnh đại diện',
            'Bạn có chắc muốn xóa ảnh đại diện?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        setAvatarUri(null);
                        setDeleteAvatar(true);
                    },
                },
            ]
        );
    };

    // ─── Validate + Submit ────────────────────────────────────────────────────
    const handleSubmit = () => {
        // === BƯỚC 1: Validate cục bộ (KHÔNG gọi API nếu fail) ===
        if (!formData.name || !formData.name.trim()) {
            Alert.alert('Lỗi', 'Họ tên không được để trống!');
            return; // Dừng hoàn toàn, không dispatch
        }

        if (formData.phone && !/^[0-9]{9,11}$/.test(formData.phone.trim())) {
            Alert.alert('Lỗi', 'Số điện thoại không hợp lệ (9-11 chữ số)!');
            return; // Dừng hoàn toàn, không dispatch
        }

        // === BƯỚC 2: Validate thông qua → build FormData và gọi API ===
        const data = new FormData();
        data.append('name', formData.name.trim());
        data.append('bio', formData.bio?.trim() || '');
        data.append('phone', formData.phone?.trim() || '');

        if (deleteAvatar) {
            data.append('deleteAvatar', 'true');
        } else if (avatarUri && !avatarUri.startsWith('http')) {
            // Chỉ append nếu là file local mới (không phải URL cũ từ server)
            const filename = avatarUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            data.append('avatar', {
                uri: avatarUri,
                name: filename,
                type,
            });
        }

        // Đánh dấu đang submit để useEffect biết cần xử lý kết quả
        isSubmittingRef.current = true;

        dispatch(updateProfile(data));
    };

    const user = profile?.data;

    if (isLoading && !user) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#f43f5e" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                            <ArrowLeft size={24} color="#000" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold">Chỉnh sửa hồ sơ</Text>
                    </View>

                    <View className="px-6 py-6">
                        {/* Avatar Section */}
                        <View className="items-center mb-8">
                            <View className="relative">
                                <Image
                                    source={{
                                        uri: avatarUri || 'https://i.pravatar.cc/150?img=3',
                                    }}
                                    className="w-32 h-32 rounded-full border-4 border-rose-100"
                                />
                                <TouchableOpacity
                                    onPress={pickImage}
                                    className="absolute bottom-0 right-0 bg-rose-500 p-3 rounded-full shadow-lg"
                                >
                                    <Camera size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-sm text-gray-500 mt-4 text-center">
                                Cho phép JPG, GIF hoặc PNG. Tối đa 2MB
                            </Text>
                            <View className="flex-row gap-3 mt-3">
                                <TouchableOpacity
                                    onPress={pickImage}
                                    className="px-4 py-2 bg-gray-100 rounded-lg"
                                >
                                    <Text className="text-gray-700 font-medium">Tải lên</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleDeleteAvatar}
                                    className="px-4 py-2 bg-rose-50 rounded-lg flex-row items-center gap-2"
                                >
                                    <Trash2 size={16} color="#f43f5e" />
                                    <Text className="text-rose-500 font-medium">Xóa</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Form */}
                        <View className="space-y-6">
                            <View className="border-b border-gray-100 pb-4 mb-4">
                                <Text className="text-lg font-bold text-gray-800">
                                    Thông tin cá nhân
                                </Text>
                                <Text className="text-sm text-gray-500">
                                    Chỉnh sửa thông tin cá nhân của bạn
                                </Text>
                            </View>

                            {/* Full Name */}
                            <View>
                                <Text className="mb-2 text-[15px] font-semibold text-gray-700">
                                    Họ và tên <Text className="text-rose-500">*</Text>
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="Nhập họ và tên"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.name}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, name: text })
                                    }
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Phone */}
                            <View>
                                <Text className="mb-2 text-[15px] font-semibold text-gray-700">
                                    Số điện thoại
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="Nhập số điện thoại"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.phone}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, phone: text })
                                    }
                                    keyboardType="phone-pad"
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Bio */}
                            <View>
                                <Text className="mb-2 text-[15px] font-semibold text-gray-700">
                                    Giới thiệu
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="Giới thiệu về bản thân..."
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.bio}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, bio: text })
                                    }
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    editable={!isLoading}
                                />
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
                                        Cập nhật hồ sơ
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

export default EditProfileScreen;
