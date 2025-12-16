import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wishlistApi } from '../../api/wishlistApi';
import Toast from 'react-native-toast-message';

const initialState = {
  items: [], // Danh sách khóa học trong wishlist
  isLoading: false,
  isError: false,
  message: '',
};

// Thunk: Lấy danh sách wishlist từ server
export const getWishlist = createAsyncThunk(
  'wishlist/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await wishlistApi.getWishlist();
      return response.data.data; // Giả sử backend trả về { data: [...] }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

// Thunk: Thêm khóa học vào wishlist
export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async (courseId, thunkAPI) => {
    try {
      const response = await wishlistApi.addToWishlist(courseId);
      // Gọi lại getWishlist để đồng bộ state mới nhất từ server
      thunkAPI.dispatch(getWishlist()); 
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

// Thunk: Xóa 1 khóa học khỏi wishlist
export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (courseId, thunkAPI) => {
    try {
      await wishlistApi.removeFromWishlist(courseId);
      return courseId; // Trả về ID để filter khỏi state
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

// Thunk: Xóa tất cả wishlist (trên server)
export const clearWishlist = createAsyncThunk(
  'wishlist/clear',
  async (_, thunkAPI) => {
    try {
      await wishlistApi.clearWishlist();
      return [];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    // === LOGIC XÓA STATE KHI LOGOUT ===
    // Action này reset state về rỗng mà không gọi API
    clearWishlistState: (state) => {
      state.items = [];
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Wishlist
      .addCase(getWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(getWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Add to Wishlist
      .addCase(addToWishlist.fulfilled, (action) => {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: action.payload.message || "Đã thêm vào danh sách yêu thích"
        });
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        Toast.show({
          type: 'info',
          text1: 'Thông báo',
          text2: action.payload || "Khóa học này đã có trong wishlist"
        });
      })
      
      // Remove Item
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = state.items.filter((course) => course._id !== action.payload);
        Toast.show({
          type: 'success',
          text1: 'Đã xóa',
          text2: "Đã xóa khỏi danh sách yêu thích"
        });
      })
      
      // Clear All (Server side)
      .addCase(clearWishlist.fulfilled, (state) => {
        state.items = [];
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: "Đã xóa toàn bộ danh sách yêu thích"
        });
      });
  },
});

export const { clearWishlistState } = wishlistSlice.actions;

export default wishlistSlice.reducer;