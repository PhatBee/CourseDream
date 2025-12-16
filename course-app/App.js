// App.js
import React, { useEffect, useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/app/store.js';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { setCredentials } from './src/features/auth/authSlice';
import { getUser, getToken } from './src/utils/storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "./global.css"

// Import Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import VerifyOTPScreen from './src/screens/auth/VerifyOTPScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import VerifyResetOTPScreen from './src/screens/auth/VerifyResetOTPScreen';
import SetPasswordScreen from './src/screens/auth/SetPasswordScreen';
import HomeScreen from './src/screens/home/HomeScreen';

const Stack = createStackNavigator();

const MainNavigator = () => {
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await getToken();
        const user = await getUser();
        if (token && user) {
          dispatch(setCredentials(user));
        }
      } catch (e) {
        console.log(e);
      } finally {
        setIsReady(true);
      }
    };
    checkLoginStatus();
  }, []);

  if (!isReady) return null; // Hoặc return <LoadingScreen />

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Bạn có thể thêm logic điều hướng tùy thuộc vào user đã login chưa tại đây */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyResetOTP" component={VerifyResetOTPScreen} />
      <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </Provider>
    </SafeAreaProvider>
  );
}