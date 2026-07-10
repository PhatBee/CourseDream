import axiosClient from "../../api/axiosClient";

const path = '/promotions';

const previewPromotion = async ({ code, courseIds }) => {
  const response = await axiosClient.post(`${path}/preview`, { code, courseIds });
  return response.data;
};

const getAvailablePromotions = async (courseIds) => {
  const response = await axiosClient.get(`${path}/available`, {
    params: { courseIds: courseIds.join(",") }
  });
  return response.data;
};

const getMyRewardVouchers = async () => {
  const response = await axiosClient.get(`${path}/my-rewards`);
  return response.data;
};

const promotionService = {
  previewPromotion,
  getAvailablePromotions,
  getMyRewardVouchers
};

export default promotionService;
