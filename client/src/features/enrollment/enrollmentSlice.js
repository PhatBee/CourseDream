import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import enrollmentApi from '../../api/enrollmentApi';

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

export const fetchStudentDashboard = createAsyncThunk(
  'enrollment/fetchDashboard',
  async (_, thunkAPI) => {
    try {
      const response = await enrollmentApi.getStudentDashboard();
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message);
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
      state.dashboardCourses = [];
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
      })

      .addCase(fetchStudentDashboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchStudentDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardCourses = action.payload;
      })
      .addCase(fetchStudentDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
      });
  },
});

export const { resetEnrollment, addEnrolledCourseId } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;