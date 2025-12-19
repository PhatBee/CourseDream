import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

// Lấy thông tin user từ localStorage (nếu có) khi tải lại trang
const user = JSON.parse(localStorage.getItem('user'));
const savedViewMode = localStorage.getItem('viewMode');

const initialState = {
  user: user ? user : null,
  viewMode: savedViewMode || (user?.role === 'instructor' ? 'instructor' : 'student'),
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
  isRegisterSuccess: false, // Cho trang Register
  isVerifySuccess: false,   // Cho trang VerifyOTP
  registrationEmail: null,  // Lưu email để dùng ở trang OTP
  resetEmail: null, // Lưu email từ Forgot -> Verify
  resetToken: null, // Lưu token từ Verify -> SetPassword
  isForgotSuccess: false,
  isVerifyResetSuccess: false,
  isSetPasswordSuccess: false,
  banReason: null,
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

// THUNK: Verify OTP
export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (otpData, thunkAPI) => {
    try {
      return await authService.verifyOTP(otpData);
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

// === THUNK: Google Login ===
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (credential, thunkAPI) => {
    try {
      return await authService.googleLogin(credential);
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

// === THUNK: Facebook Login ===
export const facebookLogin = createAsyncThunk(
  'auth/facebookLogin',
  async (accessToken, thunkAPI) => {
    try {
      return await authService.facebookLogin(accessToken);
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

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (emailData, thunkAPI) => {
    try {
      return await authService.forgotPassword(emailData);
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

export const verifyResetOTP = createAsyncThunk(
  'auth/verifyResetOTP',
  async (otpData, thunkAPI) => {
    try {
      return await authService.verifyResetOTP(otpData);
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

export const setNewPassword = createAsyncThunk(
  'auth/setPassword',
  async (passwordData, thunkAPI) => {
    try {
      return await authService.setPassword(passwordData);
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

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, thunkAPI) => {
    try {
      // 'profileData' là { name, avatar, bio }
      return await authService.updateProfile(profileData);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (passwordData, thunkAPI) => {
    try {
      return await authService.changePassword(passwordData);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// === GET PROFILE ===
export const getProfile = createAsyncThunk(
  "auth/getProfile",
  async (_, thunkAPI) => {
    try {
      return await authService.getProfile(); // Trả về { success, data }
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
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
      state.isRegisterSuccess = false;
      state.isVerifySuccess = false;
      state.isForgotSuccess = false;
      state.isVerifyResetSuccess = false;
      state.isSetPasswordSuccess = false;
    },
    // Reducer mới để xóa state reset (khi hoàn thành)
    clearReset: (state) => {
      state.resetEmail = null;
      state.resetToken = null;
      state.isForgotSuccess = false;
      state.isVerifyResetSuccess = false;
      state.isSetPasswordSuccess = false;
    },
    // Reducer mới để xóa trạng thái lỗi/success sau khi hoàn thành
    clearStatus: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSetPasswordSuccess = false;
      state.message = "";
    },
    // Thêm reducer để set email
    setRegistrationEmail: (state, action) => {
      state.registrationEmail = action.payload;
    },
    toggleViewMode: (state) => {
      const newMode = state.viewMode === 'student' ? 'instructor' : 'student';
      state.viewMode = newMode;
      localStorage.setItem('viewMode', newMode);
    },
  },
  extraReducers: (builder) => {
    builder
      // Xử lý khi 'login' đang chờ (pending)
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
        state.banReason = null;
      })
      .addCase(reset, (state) => { state.banReason = null; })
      // Xử lý khi 'login' thành công (fulfilled)
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user; // Lấy user từ payload
        const defaultMode = action.payload.user.role === 'instructor' ? 'instructor' : 'student';
        state.viewMode = defaultMode;
        localStorage.setItem('viewMode', defaultMode);
      })
      // Xử lý khi 'login' thất bại (rejected)
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        if (action.payload && typeof action.payload === 'object') {
            state.message = action.payload.message;
            state.banReason = action.payload.reason;
        } else {
            state.message = action.payload;
            state.banReason = null;
        }
      })
      // Xử lý khi 'logout'
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isSuccess = false;
        state.isError = false;
        state.message = '';
        localStorage.removeItem('viewMode');
      })
      // === REGISTER CASES ===
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRegisterSuccess = true; // <-- Dùng cờ riêng
        // KHÔNG set user/token, chỉ set message
        state.message = action.payload.message;
        state.registrationEmail = action.payload.email; // <-- Lưu email
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload; // Lấy lỗi từ payload
        state.user = null;
      })
      // === VERIFY OTP CASES ===
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isVerifySuccess = true; // <-- Dùng cờ riêng
        state.message = action.payload.message;
        state.registrationEmail = null; // Xóa email sau khi xong
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // === GOOGLE LOGIN CASES (Giống hệt login) ===
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        const defaultMode = action.payload.user.role === 'instructor' ? 'instructor' : 'student';
        state.viewMode = defaultMode;
        localStorage.setItem('viewMode', defaultMode);
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      // === FACEBOOK LOGIN CASES (Giống hệt login) ===
      .addCase(facebookLogin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(facebookLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        const defaultMode = action.payload.user.role === 'instructor' ? 'instructor' : 'student';
        state.viewMode = defaultMode;
        localStorage.setItem('viewMode', defaultMode);
      })
      .addCase(facebookLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      // === FORGOT PASSWORD CASES ===
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isForgotSuccess = true;
        state.message = action.payload.message;
        state.resetEmail = action.payload.email; // <-- Lưu email
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // === VERIFY RESET OTP CASES ===
      .addCase(verifyResetOTP.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyResetOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isVerifyResetSuccess = true;
        state.message = action.payload.message;
        state.resetToken = action.payload.resetToken; // <-- Lưu token
      })
      .addCase(verifyResetOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // === SET PASSWORD CASES ===
      .addCase(setNewPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(setNewPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSetPasswordSuccess = true;
        state.message = action.payload.message;
      })
      .addCase(setNewPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // === UPDATE PROFILE ===
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload;
      })

      // === CHANGE PASSWORD ===
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message;

        // [CẬP NHẬT MỚI] Nếu thành công, nghĩa là user giờ đã có mật khẩu
        if (state.user) {
          state.user.hasPassword = true;
          // Cập nhật luôn vào localStorage để đồng bộ
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // === GET PROFILE ===
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data; // Cập nhật vào Redux
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

  },
});

export const { reset, setRegistrationEmail, clearReset, clearStatus, toggleViewMode } = authSlice.actions;
export default authSlice.reducer;