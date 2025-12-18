import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';

import {
    User,
    BookOpen,
    Heart,
    Lock,
    Settings,
    LogOut,
    ChevronRight,
    Book,
    Grid,
} from 'lucide-react-native';

const ProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!user) {
            navigation.replace('Login');
        }
    }, [user, navigation]);

    if (!user) {
        return null;
    }


    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await dispatch(logout());
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
                    },
                },
            ]
        );
    };

    const menuItems = [
        {
            section: 'Dashboard',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: Grid, screen: 'Dashboard', show: true },
                { id: 'profile', label: 'My Profile', icon: User, screen: 'MyProfile', show: true },
                { id: 'enrolled', label: 'Enrolled Courses', icon: BookOpen, screen: 'EnrolledCourses', show: true },
                { id: 'wishlist', label: 'Wishlist', icon: Heart, screen: 'Wishlist', show: true },
                {
                    id: 'my-courses',
                    label: 'My Courses',
                    icon: Book,
                    screen: 'MyCourses',
                    show: user?.role === 'instructor' || user?.role === 'admin',
                },
            ],
        },
        {
            section: 'Account Settings',
            items: [
                { id: 'instructor-profile', label: 'Instructor Profile', icon: User, screen: 'InstructorProfile', show: user?.role === 'instructor' || user?.role === 'admin' },
                { id: 'change-password', label: 'Change Password', icon: Lock, screen: 'ChangePassword', show: true },
                { id: 'settings', label: 'Settings', icon: Settings, screen: 'Settings', show: true },
            ],
        },
    ];

    const MenuItem = ({ item }) => {
        if (!item.show) return null;
        const Icon = item.icon;

        return (
            <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100"
                onPress={() => navigation.navigate(item.screen)}
            >
                <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center mr-3">
                        <Icon size={20} color="#e11d48" />
                    </View>
                    <Text className="text-gray-900 text-base font-medium">
                        {item.label}
                    </Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ===== PROFILE HEADER (ROSE GRADIENT) ===== */}
                <LinearGradient
                    colors={['#f43f5e', '#9f1239']} // rose-500 → rose-800
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="px-6 pt-6 pb-8"
                >
                    <View className="flex-row items-center">
                        <Image
                            source={{ uri: user.avatar || 'https://i.pravatar.cc/150?img=3' }}
                            className="w-20 h-20 rounded-full border-2 border-white"
                        />
                        <View className="ml-4 flex-1">
                            <Text className="text-white text-2xl font-bold">
                                {user.name}
                            </Text>
                            <Text className="text-white/90 text-sm capitalize mt-1">
                                {user.role}
                            </Text>
                            {user.email && (
                                <Text className="text-white/80 text-xs mt-1">
                                    {user.email}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="mt-6 flex-row gap-3">
                        {user.role === 'student' ? (
                            <TouchableOpacity
                                className="flex-1 bg-white px-4 py-3 rounded-full"
                                onPress={() =>
                                    Alert.alert(
                                        'Coming Soon',
                                        'Become an Instructor feature is coming soon!'
                                    )
                                }
                            >
                                <Text className="text-rose-600 text-center font-semibold text-sm">
                                    Become an Instructor
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                className="flex-1 bg-white/20 px-4 py-3 rounded-full"
                                onPress={() =>
                                    Alert.alert(
                                        'Coming Soon',
                                        'Instructor Dashboard is coming soon!'
                                    )
                                }
                            >
                                <Text className="text-white text-center font-semibold text-sm">
                                    Instructor Dashboard
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>

                {/* ===== MENU ===== */}
                <View className="mt-6">
                    {menuItems.map((section, index) => (
                        <View key={index} className="mb-6">
                            <Text className="px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {section.section}
                            </Text>
                            <View className="bg-white rounded-xl mx-4 overflow-hidden shadow-sm">
                                {section.items.map((item) => (
                                    <MenuItem key={item.id} item={item} />
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Logout */}
                    <View className="px-4 mb-8">
                        <TouchableOpacity
                            className="flex-row items-center justify-center px-4 py-4 bg-white rounded-xl shadow-sm border border-rose-100"
                            onPress={handleLogout}
                        >
                            <LogOut size={20} color="#e11d48" />
                            <Text className="text-rose-600 text-base font-semibold ml-2">
                                Logout
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;
