import React, { useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '../../features/user/userSlice';
import {
    ArrowLeft,
    Edit,
    Calendar,
    Mail,
    Phone,
    User as UserIcon,
} from 'lucide-react-native';

const formatDate = (ts) => {
    if (!ts) return 'N/A';
    const date = new Date(ts);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const InfoCard = ({ icon: Icon, label, value }) => (
    <View className="p-4 rounded-xl bg-gray-50 border border-gray-100">
        <View className="flex-row items-center gap-3 mb-2">
            <View className="p-2 bg-white rounded-lg shadow-sm">
                <Icon size={18} color="#9ca3af" />
            </View>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                {label}
            </Text>
        </View>
        <Text className="text-gray-800 font-semibold pl-1">
            {value || 'Not provided'}
        </Text>
    </View>
);

const MyProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch]);

    const { isLoading, profile } = useSelector((state) => state.user);



    const user = profile?.data;

    if (isLoading && !user) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#f43f5e" />
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <Text className="text-gray-600">No profile data</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-xl font-bold">My Profile</Text>
                        <Text className="text-sm text-gray-500">View your information</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('EditProfile')}
                    className="p-2 bg-rose-50 rounded-lg"
                >
                    <Edit size={20} color="#f43f5e" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-6 py-6">
                    {/* Avatar & Name */}
                    <View className="items-center mb-8">
                        <Image
                            source={{
                                uri: user.avatar || 'https://i.pravatar.cc/150?img=3',
                            }}
                            className="w-32 h-32 rounded-full border-4 border-rose-100 mb-4"
                        />
                        <Text className="text-2xl font-bold text-gray-900">{user.name}</Text>
                        <Text className="text-sm text-gray-500 capitalize mt-1">
                            {user.role}
                        </Text>
                    </View>

                    {/* Info Cards */}
                    <View className="space-y-4 mb-6">
                        <InfoCard icon={UserIcon} label="Full Name" value={user.name} />
                        <InfoCard
                            icon={Calendar}
                            label="Registration Date"
                            value={formatDate(user.createdAt)}
                        />
                        <InfoCard icon={Mail} label="Email Address" value={user.email} />
                        <InfoCard icon={Phone} label="Phone Number" value={user.phone} />
                    </View>

                    {/* Bio Section */}
                    <View className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <Text className="text-sm font-bold text-gray-800 mb-3">Bio</Text>
                        <Text className="text-gray-600 leading-relaxed text-sm">
                            {user.bio ||
                                'No bio information provided yet. Click edit to introduce yourself!'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default MyProfileScreen;
