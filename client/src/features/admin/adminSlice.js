import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminApi } from '../../api/adminApi';

const initialState = {
  stats: null,          // Dữ liệu tổng quan (counts, top courses...)
  revenueData: null,    // Dữ liệu biểu đồ doanh thu
  isLoading: false,
  isError: false,
  message: '',
};

// 1. Thunk: Lấy số liệu tổng quan
export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, thunkAPI) => {
    try {
      const response = await adminApi.getDashboardStats();
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Error fetching stats');
    }
  }
);

// 2. Thunk: Lấy biểu đồ doanh thu
export const fetchRevenueAnalytics = createAsyncThunk(
  'admin/fetchRevenueAnalytics',
  async (type, thunkAPI) => {
    try {
      const response = await adminApi.getRevenueAnalytics(type);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Error fetching revenue');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Revenue Analytics
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
        state.revenueData = action.payload;
      });
  },
});

export default adminSlice.reducer;