import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

// Lấy thông tin user và token từ localStorage (nếu có) khi tải lại trang
const user = JSON.parse(localStorage.getItem('user'));
const token = JSON.parse(localStorage.getItem('token'));

const initialState = {
  user: user ? user : null,
  token: token ? token : null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Async Thunk cho Đăng nhập
export const login = createAsyncThunk(
  'auth/login',
  async (userData, thunkAPI) => {
    try {
      return await authService.login(userData);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Async Thunk cho Đăng xuất
export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

// Async Thunk cho Đăng ký
export const register = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);


export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Dùng để reset state khi cần (ví dụ: sau khi gặp lỗi)
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Xử lý khi 'login' đang chờ (pending)
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      // Xử lý khi 'login' thành công (fulfilled)
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user; // Lấy user từ payload
        state.token = action.payload.token; // Lấy token từ payload
      })
      // Xử lý khi 'login' thất bại (rejected)
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload; // Lấy thông báo lỗi từ payload
        state.user = null;
        state.token = null;
      })
      // Xử lý khi 'logout'
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      })
      // === REGISTER CASES ===
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // KHÔNG set user/token, chỉ set message
        state.message = action.payload.message; 
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload; // Lấy lỗi từ payload
        state.user = null;
        state.token = null;
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;