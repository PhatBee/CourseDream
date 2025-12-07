import axiosClient from "./axiosClient";

const path = "/admin";

const getDashboardStats = () => {
  return axiosClient.get(`${path}/dashboard-stats`);
};

/**
 * @param {string} type - 'year' | 'month' | 'week'
 */
const getRevenueAnalytics = (type = 'year') => {
  return axiosClient.get(`${path}/revenue-analytics`, { params: { type } });
};

const getPendingApplications = () => {
  return axiosClient.get(`${path}/instructor-applications`);
};

const reviewApplication = (userId, data) => {
  return axiosClient.put(`${path}/instructor-applications/${userId}`, data);
};

export const adminApi = {
  getDashboardStats,
  getRevenueAnalytics,
  getPendingApplications,
  reviewApplication
};