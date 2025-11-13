import axiosClient from "./axiosClient";

const path = "/courses";

const getDetailsBySlug = (slug) => {
  return axiosClient.get(`${path}/${slug}`, slug);
};

export const courseApi = {
  getDetailsBySlug,
};