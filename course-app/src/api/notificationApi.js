import axiosClient from './axiosClient';
const path = '/notifications';

const notificationApi = {
  getMyNotifications: () => axiosClient.get(path),
  markAsRead: (notificationId) => axiosClient.patch(`${path}/${notificationId}/read`),
  markAllAsRead: () => axiosClient.patch(`${path}/read-all`),
};

export default notificationApi;