import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Thay đổi import từ axiosClient sang categoryApi
import { categoryApi } from '../../api/categoryApi'; 

export const getCategories = createAsyncThunk(
  'categories/getAll',
  async (_, thunkAPI) => {
    try {
      // Gọi qua API chuẩn
      const response = await categoryApi.getAllCategories();
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default categorySlice.reducer;