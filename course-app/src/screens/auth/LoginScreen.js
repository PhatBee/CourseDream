import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login, googleLogin, facebookLogin, reset } from '../../features/auth/authSlice';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { GOOGLE_CLIENT_ID, FACEBOOK_APP_ID } from '../../utils/config';

// Cần thiết cho web browser auth session
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch();
    const { isLoading, isError, isSuccess, message, user } = useSelector((state) => state.auth);

    // --- GOOGLE SETUP ---
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        // iOS/Android client IDs nếu cần cấu hình riêng, nhưng dùng expo proxy thì clientId web là đủ
    });

    // --- FACEBOOK SETUP ---
    const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
        androidClientId: FACEBOOK_APP_ID,
        webClientId: GOOGLE_CLIENT_ID,
        iosClientId: GOOGLE_CLIENT_ID,
    });

    // Xử lý kết quả Login
    useEffect(() => {
        if (isError) {
            Alert.alert("Lỗi", message);
            dispatch(reset());
        }
        if (isSuccess || user) {
            // Navigate to Home
            navigation.replace("Home"); // Giả sử route chính là Home
            dispatch(reset());
        }
    }, [isError, isSuccess, user, message, navigation, dispatch]);

    // Xử lý phản hồi từ Google
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            dispatch(googleLogin(id_token));
        }
    }, [response]);

    // Xử lý phản hồi từ Facebook
    useEffect(() => {
        if (fbResponse?.type === 'success') {
            const { access_token } = fbResponse.params;
            dispatch(facebookLogin(access_token));
        }
    }, [fbResponse]);

    const handleLogin = () => {
        if (!email || !password) return Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin");
        dispatch(login({ email, password }));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Sign in to continue to DreamsLMS</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Login</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.divider} />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialContainer}>
                    {/* Google */}
                    <TouchableOpacity
                        style={[styles.socialButton, { marginRight: 15 }]}
                        onPress={() => promptAsync()}
                        disabled={!request}
                    >
                        {/* Bạn có thể dùng Image icon google import vào đây */}
                        <Text style={styles.socialText}>Google</Text>
                    </TouchableOpacity>

                    {/* Facebook */}
                    <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                        onPress={() => fbPromptAsync()}
                        disabled={!fbRequest}
                    >
                        <Text style={[styles.socialText, { color: '#fff' }]}>Facebook</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'center' }}>
                    <Text>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={{ color: '#F43F5E', fontWeight: 'bold' }}>Sign up</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'center' },
    header: { marginBottom: 40, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
    form: { width: '100%' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333' },
    input: {
        backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee',
        borderRadius: 12, padding: 15, marginBottom: 20, fontSize: 16
    },
    button: {
        backgroundColor: '#F43F5E', borderRadius: 25, padding: 15,
        alignItems: 'center', marginTop: 10
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
    divider: { flex: 1, height: 1, backgroundColor: '#eee' },
    orText: { marginHorizontal: 10, color: '#888' },
    socialContainer: { flexDirection: 'row', justifyContent: 'center' },
    socialButton: {
        flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ddd',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row'
    },
    socialText: { fontWeight: '600' }
});

export default LoginScreen;