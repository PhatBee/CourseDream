import axiosClient from "../../api/axiosClient";

const getProfile = async () => {
    const response = await axiosClient.get("/users/profile");
    return response.data;
};

const updateProfile = async (profileData) => {
    const response = await axiosClient.put("/users/profile", profileData);
    return response.data;
};

const changePassword = async (passwordData) => {
    const response = await axiosClient.put("/users/password", passwordData);
    return response.data;
};

const userService = {
    getProfile,
    updateProfile,
    changePassword,
};

export default userService;
