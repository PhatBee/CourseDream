import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/notificationApi";

export const getNotifications = createAsyncThunk(
  "notification/getNotifications",
  async () => {
    const data = await api.fetchNotifications();
    return data;
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "notification/markAllAsRead",
  async () => {
    await api.markAllAsRead();
    return;
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notification/markAsRead",
  async (notificationId) => {
    await api.markAsRead(notificationId);
    return notificationId;
  }
);

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(getNotifications.rejected, (state) => {
        state.loading = false;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
        state.unreadCount = 0;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        const notification = state.notifications.find((n) => n._id === id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export default notificationSlice.reducer;