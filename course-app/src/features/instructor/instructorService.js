import axiosClient from "../../api/axiosClient";

const getInstructorProfile = async () => {
    const response = await axiosClient.get("/instructor/profile");
    return response.data;
};

const updateInstructorProfile = async (data) => {
    const response = await axiosClient.put("/instructor/profile", data);
    return response.data;
};

const instructorService = {
    getInstructorProfile,
    updateInstructorProfile,
};

export default instructorService;
