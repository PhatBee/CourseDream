// App.js hoặc RootNavigation
import React, { useEffect, useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/app/store.js'; // file store redux của bạn
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { setCredentials } from './src/features/auth/authSlice';
import { getUser, getToken } from './src/utils/storage';
import LoginScreen from './src/screens/auth/LoginScreen';
// Import các màn hình khác...

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await getToken();
        const user = await getUser();
        if (token && user) {
          dispatch(setCredentials(user)); // Khôi phục user vào Redux
        }
      } catch (e) {
        console.log(e);
      } finally {
        setIsReady(true);
      }
    };
    checkLoginStatus();
  }, []);

  if (!isReady) return null; // Hoặc return component Splash Screen

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Logic điều hướng: Nếu có user thì có thể set initialRouteName là Home */}
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* <Stack.Screen name="Home" component={HomeScreen} /> */}
        {/* Thêm Register, ForgotPassword... */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}