import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Home, Compass, BookOpen, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import các màn hình
import HomeScreen from '../screens/home/HomeScreen';
import CoursesScreen from '../screens/course/CoursesScreen';
import MyLearningScreen from '../screens/learning/MyLearningScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import CartScreen from '../screens/cart/CartScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true, // Hiển thị chữ bên dưới icon
                tabBarActiveTintColor: '#e11d48', // Màu hồng (Rose-600) khi active
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#f3f4f6',
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,

                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    marginBottom: insets.bottom > 0 ? 0 : 5,
                },
            }}
        >
            {/* 1. HOME TAB */}
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Home size={24} color={color} />
                    ),
                }}
            />

            {/* 2. COURSES TAB (Tìm kiếm/Danh sách khóa học) */}
            <Tab.Screen
                name="CoursesTab"
                component={CoursesScreen}
                options={{
                    tabBarLabel: 'Courses',
                    tabBarIcon: ({ color, size }) => (
                        <Compass size={24} color={color} />
                    ),
                }}
            />

            {/* 3. MY LEARNING TAB */}
            <Tab.Screen
                name="MyLearningTab"
                component={MyLearningScreen}
                options={{
                    tabBarLabel: 'My Learning',
                    tabBarIcon: ({ color, size }) => (
                        <BookOpen size={24} color={color} />
                    ),
                }}
            />

            {/* 4. PROFILE TAB */}
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <User size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default BottomTabNavigator;