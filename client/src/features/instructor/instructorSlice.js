import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { instructorApi } from '../../api/instructorApi'; // Import đúng đường dẫn

const initialState = {
  instructorProfile: null, // Chứa headline, experience, socialLinks...
  stats: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// Thunk: Lấy Profile
export const fetchInstructorProfile = createAsyncThunk(
  'instructor/fetchProfile',
  async (_, thunkAPI) => {
    try {
      const response = await instructorApi.getInstructorProfile();
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Thunk: Cập nhật Profile
export const updateInstructorData = createAsyncThunk(
  'instructor/updateProfile',
  async (data, thunkAPI) => {
    try {
      const response = await instructorApi.updateInstructorProfile(data);
      return response.data; // { success, message, data }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const instructorSlice = createSlice({
  name: 'instructor',
  initialState,
  reducers: {
    resetInstructorState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchInstructorProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchInstructorProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.instructorProfile = action.payload;
      })
      .addCase(fetchInstructorProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Update Profile
      .addCase(updateInstructorData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateInstructorData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message;
        state.instructorProfile = action.payload.data; // Cập nhật lại state mới nhất
      })
      .addCase(updateInstructorData.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetInstructorState } = instructorSlice.actions;
export default instructorSlice.reducer;