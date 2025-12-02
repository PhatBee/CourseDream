import axiosClient from "./axiosClient";

const path = "/courses";

export const getAllCourses = (params) => {
  return axiosClient.get(path, { params });
};

const getDetailsBySlug = (slug) => {
  return axiosClient.get(`${path}/${slug}`);
};

export const searchCourses = (params) => {
  return axiosClient.get("/courses/search", { params });
};

export const courseApi = {
  getAllCourses, 
  getDetailsBySlug,
  searchCourses,
};