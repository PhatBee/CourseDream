import axiosClient from "./axiosClient";

export const getInstructorStats = () => {
  return axiosClient.get("/instructor/stats");
};