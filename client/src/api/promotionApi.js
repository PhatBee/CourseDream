import axiosClient from "./axiosClient";

export const getPromotions = async () => {
  const res = await axiosClient.get("/promotions");
  return res.data;
};

export const createPromotion = async (data) => {
  const res = await axiosClient.post("/promotions", data);
  return res.data;
};

export const updatePromotion = async (id, data) => {
  const res = await axiosClient.put(`/promotions/${id}`, data);
  return res.data;
};

export const deletePromotion = async (id) => {
  const res = await axiosClient.delete(`/promotions/${id}`);
  return res.data;
};

export const previewPromotion = async ({ code, courseId }) => {
  const res = await axiosClient.post("/promotions/preview", { code, courseId });
  return res.data;
};

export const getAvailablePromotions = async (courseIds) => {
  const res = await axiosClient.get("/promotions/available", {
    params: { courseIds: courseIds.join(",") }
  });
  return res.data;
};