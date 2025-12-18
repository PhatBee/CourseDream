import * as SecureStore from 'expo-secure-store';

export const setToken = async (token) => {
    await SecureStore.setItemAsync('accessToken', token);
};

export const getToken = async () => {
    return await SecureStore.getItemAsync('accessToken');
};

export const removeToken = async () => {
    await SecureStore.deleteItemAsync('accessToken');
};

// Lưu thông tin User (dạng JSON string)
export const setUser = async (user) => {
    await SecureStore.setItemAsync('user', JSON.stringify(user));
};

export const getUser = async () => {
    const user = await SecureStore.getItemAsync('user');
    return user ? JSON.parse(user) : null;
};

export const removeUser = async () => {
    await SecureStore.deleteItemAsync('user');
};

export const saveToken = async (token) => {
    await SecureStore.setItemAsync('accessToken', token);
};