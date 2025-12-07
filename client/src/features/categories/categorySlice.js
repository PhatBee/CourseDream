import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoryApi } from '../../api/categoryApi';
import { toast } from 'react-hot-toast';

export const getCategories = createAsyncThunk(
  'categories/getAll',
  async (params, thunkAPI) => {
    try {
      const response = await categoryApi.getAllCategories(params);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/create',
  async (data, thunkAPI) => {
    try {
      const response = await categoryApi.createCategory(data);
      toast.success("Category created successfully!");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

// Update
export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await categoryApi.updateCategory(id, data);
      toast.success("Category updated successfully!");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

// Delete
export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id, thunkAPI) => {
    try {
      await categoryApi.deleteCategory(id);
      toast.success("Category deleted successfully!");
      return id;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    pagination: {},
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get
      .addCase(getCategories.pending, (state) => { state.isLoading = true; })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      
      // Create
      .addCase(createCategory.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      
      // Update
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.items.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      
      // Delete
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c._id !== action.payload);
      });
  },
});

export default categorySlice.reducer;