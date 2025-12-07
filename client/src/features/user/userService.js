import { userApi } from "../../api/userApi.js";

// become instructor
const getInstructorApplication = async () => {
    const response = await userApi.getInstructorApplication();
    return response.data;
};

const applyToBecomeInstructor = async (data) => {
    const response = await userApi.applyToBecomeInstructor(data);
    return response.data;
};

export const userService = {
    getInstructorApplication,
    applyToBecomeInstructor
};