// App.js
import React, { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './src/app/store.js';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { setCredentials } from './src/features/auth/authSlice';
import { getUser, getToken } from './src/utils/storage';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/utils/toastConfig';
import "./global.css"
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
// import CourseDetailScreen from './src/screens/course/CourseDetailScreen';

const Stack = createStackNavigator();

const MainNavigator = () => {
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);
  const { user } = useSelector(state => state.auth);

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
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      )}
      {/* <Stack.Screen name="CourseDetail" component={CourseDetailScreen} /> */}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </Provider>
  );
}