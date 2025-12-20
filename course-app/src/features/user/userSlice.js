import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from './userService';

const initialState = {
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: '',
    profile: null,
    instructorApplication: null,
    isApplicationLoading: false,
};

// Thunk: Get Profile
export const getProfile = createAsyncThunk('user/getProfile', async (_, thunkAPI) => {
    try {
        return await userService.getProfile();
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

// Thunk: Update Profile
export const updateProfile = createAsyncThunk('user/updateProfile', async (profileData, thunkAPI) => {
    try {
        return await userService.updateProfile(profileData);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

// Thunk: Change Password
export const changePassword = createAsyncThunk('user/changePassword', async (passwordData, thunkAPI) => {
    try {
        return await userService.changePassword(passwordData);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

// Thunk: Get Instructor Application
export const getInstructorApplication = createAsyncThunk('user/getInstructorApplication', async (_, thunkAPI) => {
    try {
        return await userService.getInstructorApplication();
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

// Thunk: Apply to Become Instructor
export const applyToBecomeInstructor = createAsyncThunk('user/applyToBecomeInstructor', async (data, thunkAPI) => {
    try {
        return await userService.applyToBecomeInstructor(data);
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        return thunkAPI.rejectWithValue(message);
    }
});

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            // Get Profile
            .addCase(getProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.profile = action.payload;
            })
            .addCase(getProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload.message;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Change Password
            .addCase(changePassword.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(changePassword.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload.message;
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get Instructor Application
            .addCase(getInstructorApplication.pending, (state) => {
                state.isApplicationLoading = true;
            })
            .addCase(getInstructorApplication.fulfilled, (state, action) => {
                state.isApplicationLoading = false;
                state.instructorApplication = action.payload.data;
            })
            .addCase(getInstructorApplication.rejected, (state, action) => {
                state.isApplicationLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Apply to Become Instructor
            .addCase(applyToBecomeInstructor.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(applyToBecomeInstructor.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = action.payload.message;
            })
            .addCase(applyToBecomeInstructor.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = userSlice.actions;
export default userSlice.reducer;
