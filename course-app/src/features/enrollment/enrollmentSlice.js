import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import enrollmentApi from '../../api/enrollmentApi';
import Toast from 'react-native-toast-message';

const initialState = {
  items: [],
  dashboardData: [],
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

// Thunk: Lấy thông tin Dashboard của học viên (kèm tiến độ thật)
export const fetchStudentDashboard = createAsyncThunk(
  'enrollment/fetchStudentDashboard',
  async (_, thunkAPI) => {
    try {
      const response = await enrollmentApi.getStudentDashboard();
      // Backend trả về: { success: true, data: [...] }
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const activateEnrollmentThunk = createAsyncThunk(
  'enrollment/activateEnrollment',
  async (enrollmentId, thunkAPI) => {
    try {
      const response = await enrollmentApi.activateEnrollment(enrollmentId);
      return response.data; // { success: true, message: ..., enrollment: ... }
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
      state.dashboardData = [];
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
      })
      .addCase(fetchStudentDashboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchStudentDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardData = action.payload.data;
        
        state.enrolledCourseIds = action.payload.data.map(enrollment => {
          return enrollment.course ? enrollment.course._id : null;
        }).filter(id => id !== null);
      })
      .addCase(fetchStudentDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(activateEnrollmentThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(activateEnrollmentThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedEnrollment = action.payload.enrollment;
        if (updatedEnrollment) {
          const index = state.items.findIndex(item => item._id === updatedEnrollment._id);
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...updatedEnrollment };
          }
          if (state.dashboardData) {
            const dashIndex = state.dashboardData.findIndex(item => item._id === updatedEnrollment._id);
            if (dashIndex !== -1) {
              state.dashboardData[dashIndex] = {
                ...state.dashboardData[dashIndex],
                isActivated: updatedEnrollment.isActivated,
                startedAt: updatedEnrollment.startedAt,
                endedAt: updatedEnrollment.endedAt
              };
            }
          }
        }
      })
      .addCase(activateEnrollmentThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetEnrollment, addEnrolledCourseId } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;