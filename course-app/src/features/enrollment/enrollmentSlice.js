import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import enrollmentApi from '../../api/enrollmentApi';
import Toast from 'react-native-toast-message';

const initialState = {
  items: [],
  enrolledCourseIds: [],
  isLoading: false,
  isError: false,
  message: '',
};

// Thunk: Lấy danh sách khóa học đã đăng ký
export const fetchMyEnrollments = createAsyncThunk(
  'enrollment/fetchMyEnrollments',
  async (_, thunkAPI) => {
    try {
      const response = await enrollmentApi.getMyEnrollments();
      // Backend trả về: { total: 5, enrollments: [...] }
      return response.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState,
  reducers: {
    // Action reset khi logout
    resetEnrollment: (state) => {
      state.items = [];
      state.enrolledCourseIds = [];
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
    // Action thêm nhanh ID khi vừa mua xong (để update UI ngay lập tức)
    addEnrolledCourseId: (state, action) => {
      state.enrolledCourseIds.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyEnrollments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyEnrollments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.enrollments;
        
        state.enrolledCourseIds = action.payload.enrollments.map(enrollment => {
          return enrollment.course ? enrollment.course._id : null;
        }).filter(id => id !== null);
      })
      .addCase(fetchMyEnrollments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetEnrollment, addEnrolledCourseId } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;