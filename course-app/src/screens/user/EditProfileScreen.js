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

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch]);

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
                        dispatch(reset());
                        dispatch(getProfile());
                        navigation.goBack();
                    },
                },
            ]);
        }
    }, [isError, isSuccess, message, dispatch, navigation]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions!');
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

    const handleDeleteAvatar = () => {
        Alert.alert(
            'Delete Avatar',
            'Are you sure you want to delete your avatar?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setAvatarUri('https://i.pravatar.cc/150?img=3');
                        setDeleteAvatar(true);
                    },
                },
            ]
        );
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            return Alert.alert('Error', 'Name is required!');
        }

        const data = new FormData();
        data.append('name', formData.name);
        data.append('bio', formData.bio);
        data.append('phone', formData.phone);

        if (deleteAvatar) {
            data.append('deleteAvatar', 'true');
        } else if (avatarUri && avatarUri.startsWith('file://')) {
            // New image selected
            const filename = avatarUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            data.append('avatar', {
                uri: avatarUri,
                name: filename,
                type,
            });
        }

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
                    <Text className="text-xl font-bold">Edit Profile</Text>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
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
                                Allowed JPG, GIF or PNG. Max size of 2MB
                            </Text>
                            <View className="flex-row gap-3 mt-3">
                                <TouchableOpacity
                                    onPress={pickImage}
                                    className="px-4 py-2 bg-gray-100 rounded-lg"
                                >
                                    <Text className="text-gray-700 font-medium">Upload</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleDeleteAvatar}
                                    className="px-4 py-2 bg-rose-50 rounded-lg flex-row items-center gap-2"
                                >
                                    <Trash2 size={16} color="#f43f5e" />
                                    <Text className="text-rose-500 font-medium">Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Form */}
                        <View className="space-y-6">
                            <View className="border-b border-gray-100 pb-4 mb-4">
                                <Text className="text-lg font-bold text-gray-800">
                                    Personal Details
                                </Text>
                                <Text className="text-sm text-gray-500">
                                    Edit your personal information
                                </Text>
                            </View>

                            {/* Full Name */}
                            <View>
                                <Text className="mb-2 text-[15px] font-semibold text-gray-700">
                                    Full Name <Text className="text-rose-500">*</Text>
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="Enter your full name"
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
                                    Phone Number <Text className="text-rose-500">*</Text>
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="Enter your phone number"
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
                                    Bio <Text className="text-rose-500">*</Text>
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="Tell us about yourself"
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
                                        Update Profile
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
