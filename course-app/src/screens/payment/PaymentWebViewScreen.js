import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ArrowLeft, X } from 'lucide-react-native';
import * as Linking from 'expo-linking';


const PaymentWebViewScreen = ({ navigation, route }) => {
    const { paymentUrl, paymentMethod } = route.params;
    const webViewRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);

    const handleNavigationStateChange = (navState) => {
        const { url } = navState;
        setCanGoBack(navState.canGoBack);



        // Check if URL contains payment result params (success, message, method)
        // This works for any return URL configured in backend
        if (url.includes('/payment/result')) {
            // Extract query params from URL
            const queryString = url.split('?')[1];

            // Navigate to PaymentResult screen
            navigation.replace('PaymentResult', { queryString });
        }
    };

    const handleGoBack = () => {
        if (canGoBack && webViewRef.current) {
            webViewRef.current.goBack();
        } else {
            navigation.goBack();
        }
    };

    const handleClose = () => {
        navigation.navigate('Home');
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                <TouchableOpacity onPress={handleGoBack} className="p-2">
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-lg font-semibold">
                    Thanh toán {paymentMethod.toUpperCase()}
                </Text>
                <TouchableOpacity onPress={handleClose} className="p-2">
                    <X size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* WebView */}
            <WebView
                ref={webViewRef}
                source={{ uri: paymentUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View className="absolute inset-0 items-center justify-center bg-white">
                        <ActivityIndicator size="large" color="#f43f5e" />
                        <Text className="mt-4 text-gray-600">Đang tải...</Text>
                    </View>
                )}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <View className="absolute inset-0 items-center justify-center bg-white/80">
                    <ActivityIndicator size="large" color="#f43f5e" />
                    <Text className="mt-4 text-gray-600">Đang tải...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

export default PaymentWebViewScreen;
