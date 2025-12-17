import axios from "./axiosClient";

export const fetchNotifications = async () => {
  const res = await axios.get("notifications");
  return res.data;
};

export const markAllAsRead = async () => {
  const res = await axios.patch("notifications/read-all");
  return res.data;
};

export const markAsRead = async (notificationId) => {
  const res = await axios.patch(`notifications/${notificationId}/read`);
  return res.data;
};