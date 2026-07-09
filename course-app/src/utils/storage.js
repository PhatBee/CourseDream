import * as SecureStore from 'expo-secure-store';

export const setToken = async (token) => {
    if (typeof token === 'string') {
        await SecureStore.setItemAsync('accessToken', token);
    }
};

export const getToken = async () => {
    return await SecureStore.getItemAsync('accessToken');
};

export const removeToken = async () => {
    await SecureStore.deleteItemAsync('accessToken');
};

// Lưu thông tin User (dạng JSON string)
export const setUser = async (user) => {
    if (user) {
        await SecureStore.setItemAsync('user', JSON.stringify(user));
    }
};

export const getUser = async () => {
    const user = await SecureStore.getItemAsync('user');
    return user ? JSON.parse(user) : null;
};

export const removeUser = async () => {
    await SecureStore.deleteItemAsync('user');
};

export const saveToken = async (token) => {
    if (typeof token === 'string') {
        await SecureStore.setItemAsync('accessToken', token);
    }
};

export const saveRefreshToken = async (token) => {
    if (typeof token === 'string') {
        await SecureStore.setItemAsync('refreshToken', token);
    }
};

export const getRefreshToken = async () => {
    return await SecureStore.getItemAsync('refreshToken');
};

export const removeRefreshToken = async () => {
    await SecureStore.deleteItemAsync('refreshToken');
};