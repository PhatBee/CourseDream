import userApi from "../../api/userApi";

const getProfile = async () => {
    const response = await userApi.getProfile();
    return response.data;
};

const updateProfile = async (profileData) => {
    const response = await userApi.updateProfile(profileData);
    return response.data;
};

const changePassword = async (passwordData) => {
    const response = await userApi.changePassword(passwordData);
    return response.data;
};

const getInstructorApplication = async () => {
    const response = await userApi.getInstructorApplication();
    return response.data;
};

const applyToBecomeInstructor = async (data) => {
    const response = await userApi.applyToBecomeInstructor(data);
    return response.data;
};

const userService = {
    getProfile,
    updateProfile,
    changePassword,
    getInstructorApplication,
    applyToBecomeInstructor,
};

export default userService;
