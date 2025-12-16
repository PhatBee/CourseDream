import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

const initialState = {
    user: null, // Khởi tạo null, sẽ load ở App.js
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// ... Các Thunk login, googleLogin, facebookLogin giữ nguyên logic gọi service ...
export const login = createAsyncThunk('auth/login', async (user, thunkAPI) => {
    try {
        return await authService.login(user);
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
        },
        // Action đặc biệt để set user từ SecureStore khi mở app
        setCredentials: (state, action) => {
            state.user = action.payload;
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
                state.message = action.payload;
                state.user = null;
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

export const { reset, setCredentials } = authSlice.actions;
export default authSlice.reducer;