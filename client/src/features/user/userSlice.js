import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from './userService';

const initialState = {
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: '',
    instructorApplication: null,
    isApplicationLoading: false,
};

// Thunk: Get Instructor Application
export const getInstructorApplication = createAsyncThunk(
    'user/getInstructorApplication',
    async (_, thunkAPI) => {
        try {
            return await userService.getInstructorApplication();
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Thunk: Apply to Become Instructor
export const applyToBecomeInstructor = createAsyncThunk(
    'user/applyToBecomeInstructor',
    async (data, thunkAPI) => {
        try {
            return await userService.applyToBecomeInstructor(data);
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return thunkAPI.rejectWithValue(message);
        }
    }
);

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
