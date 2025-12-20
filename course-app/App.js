// App.js
import React, { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './src/app/store.js';
import Toast from 'react-native-toast-message';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { setCredentials } from './src/features/auth/authSlice';
import { getUser, getToken, removeToken, removeUser } from './src/utils/storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import axiosClient from './src/api/axiosClient';
import { toastConfig } from './src/utils/toastConfig';
import "./global.css"
import { getCart } from './src/features/cart/cartSlice';
import io from 'socket.io-client';
import { fetchNotifications } from './src/features/notification/notificationSlice';

// Import Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import VerifyOTPScreen from './src/screens/auth/VerifyOTPScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import VerifyResetOTPScreen from './src/screens/auth/VerifyResetOTPScreen';
import SetPasswordScreen from './src/screens/auth/SetPasswordScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
// import CourseDetailScreen from './src/screens/course/CourseDetailScreen';

// User Screens
import ProfileScreen from './src/screens/user/ProfileScreen';
import DashboardScreen from './src/screens/user/DashboardScreen';
import MyProfileScreen from './src/screens/user/MyProfileScreen';
import EditProfileScreen from './src/screens/user/EditProfileScreen';
import EnrolledCoursesScreen from './src/screens/user/EnrolledCoursesScreen';
import WishlistScreen from './src/screens/user/WishlistScreen';
import MyCoursesScreen from './src/screens/instructor/MyCoursesScreen.js';
import ChangePasswordScreen from './src/screens/user/ChangePasswordScreen';
import SettingsScreen from './src/screens/user/SettingsScreen';
import LearningScreen from './src/screens/learning/LearningScreen';
import InstructorProfileScreen from './src/screens/user/InstructorProfileScreen';
import BecomeInstructorScreen from './src/screens/user/BecomeInstructorScreen';
import CartScreen from './src/screens/cart/CartScreen.js';
import CheckoutScreen from './src/screens/cart/CheckoutScreen.js';
import PaymentWebViewScreen from './src/screens/payment/PaymentWebViewScreen.js';
import PaymentResultScreen from './src/screens/payment/PaymentResultScreen.js';

import CourseDetailScreen from './src/screens/course/CourseDetailScreen.js';
import DiscussionScreen from './src/screens/discussion/DiscussionScreen';
import NotificationScreen from './src/screens/notification/NotificationScreen';

const Stack = createStackNavigator();

const SOCKET_URL = 'http://192.168.1.27:5000'; // Đổi thành URL backend của bạn

const MainNavigator = () => {
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await getToken();
        const storedUser = await getUser();

        if (token && storedUser) {
          // Verify token với server bằng cách gọi một API đơn giản
          try {
            // Thử gọi API để verify token còn hợp lệ không
            // axiosClient sẽ tự động refresh token nếu cần
            const response = await axiosClient.get('/users/profile');

            if (response.data) {
              // Token hợp lệ, set user
              dispatch(setCredentials(storedUser));
            }
          } catch (error) {
            // Token không hợp lệ hoặc hết hạn
            console.log('Token invalid or expired, clearing storage');
            await removeToken();
            await removeUser();
            // User sẽ ở trạng thái guest
          }
        }
      } catch (e) {
        console.log('Error checking login status:', e);
      } finally {
        setIsReady(true);
      }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (user) {
      dispatch(getCart());
    }
  }, [user, dispatch]);

  useEffect(() => {
    let socket;
    if (user) {
      socket = io(SOCKET_URL, {
        query: { userId: user._id }
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
      });
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on(`user_${user._id}`, (data) => {
        console.log('Socket event user_', data);
        dispatch(fetchNotifications());
      });

      socket.on('new_notification', (data) => {
        console.log('Socket event new_notification', data);
        dispatch(fetchNotifications());
      });
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, [user, dispatch]);

  if (!isReady) return null; // Hoặc return <LoadingScreen />

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Bạn có thể thêm logic điều hướng tùy thuộc vào user đã login chưa tại đây */}
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />

      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyResetOTP" component={VerifyResetOTPScreen} />
      <Stack.Screen name="SetPassword" component={SetPasswordScreen} />

      {/* User Screens */}

      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="MyProfile" component={MyProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="EnrolledCourses" component={EnrolledCoursesScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="MyCourses" component={MyCoursesScreen} />
      <Stack.Screen name="InstructorProfile" component={InstructorProfileScreen} />
      <Stack.Screen name="BecomeInstructor" component={BecomeInstructorScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="CartScreen" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PaymentResult" component={PaymentResultScreen} options={{ headerShown: false }} />

      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Learning" component={LearningScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DiscussionScreen" component={DiscussionScreen} />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
    </Stack.Navigator>
  );
};

export default function App() {
  // Deep Linking Configuration
  const linking = {
    prefixes: ['courseapp://'],
    config: {
      screens: {
        PaymentResult: 'payment/result',
      },
    },
  };

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <MainNavigator />
        </NavigationContainer>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </Provider>
  );
}