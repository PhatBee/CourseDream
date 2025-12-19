import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationApi from '../../api/notificationApi';

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, thunkAPI) => {
    try {
      const res = await notificationApi.getMyNotifications();
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue('Không thể tải thông báo');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId, thunkAPI) => {
    try {
      await notificationApi.markAsRead(notificationId);
      return notificationId;
    } catch (err) {
      return thunkAPI.rejectWithValue('Không thể đánh dấu đã đọc');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, thunkAPI) => {
    try {
      await notificationApi.markAllAsRead();
      return true;
    } catch (err) {
      return thunkAPI.rejectWithValue('Không thể đánh dấu tất cả đã đọc');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.notifications = state.notifications.map(n =>
          n._id === action.payload ? { ...n, read: true } : n
        );
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map(n => ({ ...n, read: true }));
        state.unreadCount = 0;
      });
  }
});

export default notificationSlice.reducer;