import axiosClient from "../../api/axiosClient";
import { setToken, setUser, removeToken, removeUser } from "../../utils/storage";

const login = async (userData) => {
    const response = await axiosClient.post("/auth/login", userData);
    if (response.data) {
        // Lưu Token và User vào thiết bị
        await setToken(response.data.accessToken);
        await setUser(response.data.user);
    }
    return response.data;
};

const googleLogin = async (credential) => {
    const response = await axiosClient.post("/auth/google", { credential });
    if (response.data) {
        await setToken(response.data.accessToken);
        await setUser(response.data.user);
    }
    return response.data;
};

const facebookLogin = async (accessToken) => {
    const response = await axiosClient.post("/auth/facebook", { accessToken });
    if (response.data) {
        await setToken(response.data.accessToken);
        await setUser(response.data.user);
    }
    return response.data;
};

const logout = async () => {
    try {
        await axiosClient.post("/auth/logout");
    } catch (error) {
        console.log(error);
    }
    await removeToken();
    await removeUser();
};

const authService = {
    login,
    googleLogin,
    facebookLogin,
    logout,
};

export default authService;