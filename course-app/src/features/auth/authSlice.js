import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

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

export const logout = createAsyncThunk('auth/logout', async () => {
    await authService.logout();
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
        },
        // Action đặc biệt để set user từ SecureStore khi mở app
        setCredentials: (state, action) => {
            state.user = action.payload;
        },
        // Reducer để set email đăng ký
        setRegistrationEmail: (state, action) => {
            state.registrationEmail = action.payload;
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
            });
    },
});

export const { reset, setCredentials, setRegistrationEmail } = authSlice.actions;
export default authSlice.reducer;