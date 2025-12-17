import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';
import { clearWishlistState } from '../wishlist/wishlistSlice';
import { resetEnrollment } from '../enrollment/enrollmentSlice';

const initialState = {
    user: null, // Khởi tạo null, sẽ load ở App.js
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
    banReason: null,
    isRegisterSuccess: false, // Cho trang Register
    isVerifySuccess: false,   // Cho trang VerifyOTP
    registrationEmail: null,  // Lưu email để dùng ở trang OTP
    resetEmail: null,         // Lưu email từ Forgot -> Verify
    resetToken: null,         // Lưu token từ Verify -> SetPassword
    isForgotSuccess: false,
    isVerifyResetSuccess: false,
    isSetPasswordSuccess: false,
};

// ... Các Thunk login, googleLogin, facebookLogin giữ nguyên logic gọi service ...
export const login = createAsyncThunk('auth/login', async (user, thunkAPI) => {
    try {
        return await authService.login(user);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        const reason = error.response?.data?.reason;

        // Nếu có banReason, trả về object với cả message và reason
        if (reason) {
            return thunkAPI.rejectWithValue({ message, reason });
        }

        return thunkAPI.rejectWithValue(message);
    }
});

export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
    try {
        return await authService.register(userData);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const verifyOTP = createAsyncThunk('auth/verifyOTP', async (otpData, thunkAPI) => {
    try {
        return await authService.verifyOTP(otpData);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const googleLogin = createAsyncThunk('auth/googleLogin', async (credential, thunkAPI) => {
    try {
        return await authService.googleLogin(credential);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const facebookLogin = createAsyncThunk('auth/facebookLogin', async (accessToken, thunkAPI) => {
    try {
        return await authService.facebookLogin(accessToken);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
    await authService.logout();

    dispatch(resetEnrollment());
    dispatch(clearWishlistState());
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, thunkAPI) => {
    try {
        return await authService.forgotPassword(email);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const verifyResetOTP = createAsyncThunk('auth/verifyResetOTP', async (otpData, thunkAPI) => {
    try {
        return await authService.verifyResetOTP(otpData);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const setPassword = createAsyncThunk('auth/setPassword', async (passwordData, thunkAPI) => {
    try {
        return await authService.setPassword(passwordData);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
            state.banReason = null;
            state.isRegisterSuccess = false;
            state.isVerifySuccess = false;
            state.isForgotSuccess = false;
            state.isVerifyResetSuccess = false;
            state.isSetPasswordSuccess = false;
        },
        // Action đặc biệt để set user từ SecureStore khi mở app
        setCredentials: (state, action) => {
            state.user = action.payload;
        },
        // Reducer để set email đăng ký
        setRegistrationEmail: (state, action) => {
            state.registrationEmail = action.payload;
        },
        // Reducer mới để xóa state reset (khi hoàn thành)
        clearReset: (state) => {
            state.resetEmail = null;
            state.resetToken = null;
            state.isForgotSuccess = false;
            state.isVerifyResetSuccess = false;
            state.isSetPasswordSuccess = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => { state.isLoading = true; })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.user;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.user = null;

                // Xử lý payload có thể là string hoặc object
                if (typeof action.payload === 'object' && action.payload !== null) {
                    state.message = action.payload.message || 'Đăng nhập thất bại';
                    state.banReason = action.payload.reason || null;
                } else {
                    state.message = action.payload || 'Đăng nhập thất bại';
                    state.banReason = null;
                }
            })
            // === REGISTER CASES ===
            .addCase(register.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isRegisterSuccess = true;
                state.message = action.payload.message;
                state.registrationEmail = action.payload.email;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // === VERIFY OTP CASES ===
            .addCase(verifyOTP.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(verifyOTP.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isVerifySuccess = true;
                state.message = action.payload.message;
                state.registrationEmail = null; // Xóa email sau khi xong
            })
            .addCase(verifyOTP.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Google & Facebook cases tương tự
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.user;
            })
            .addCase(facebookLogin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.user;
            })
            .addCase(logout.fulfilled, (state) => {
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
                state.resetEmail = action.payload.email;
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
                state.resetToken = action.payload.resetToken;
            })
            .addCase(verifyResetOTP.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // === SET PASSWORD CASES ===
            .addCase(setPassword.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(setPassword.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSetPasswordSuccess = true;
                state.message = action.payload.message;
            })
            .addCase(setPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, setCredentials, setRegistrationEmail, clearReset } = authSlice.actions;
export default authSlice.reducer;