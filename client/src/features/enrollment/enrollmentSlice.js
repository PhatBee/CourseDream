import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import enrollmentApi from '../../api/enrollmentApi';

const initialState = {
  items: [],
  dashboardCourses: [],
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

export const extendEnrollmentThunk = createAsyncThunk(
  'enrollment/extendEnrollment',
  async ({ enrollmentId, packageId, paymentMethod = 'vnpay', platform = 'web' }, thunkAPI) => {
    try {
      const response = await enrollmentApi.extendEnrollment(enrollmentId, packageId, paymentMethod, platform);
      return response.data; // { success: true, isPaid: true/false, paymentUrl: '...', enrollment: {...} }
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
          if (state.dashboardCourses) {
            const dashIndex = state.dashboardCourses.findIndex(item => item._id === updatedEnrollment._id);
            if (dashIndex !== -1) {
              state.dashboardCourses[dashIndex] = {
                ...state.dashboardCourses[dashIndex],
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

    builder
      .addCase(extendEnrollmentThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(extendEnrollmentThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Nếu là gói gia hạn có phí, phía component sẽ chịu trách nhiệm chuyển hướng đến cổng thanh toán
        if (action.payload.isPaid) {
          return;
        }

        const updatedEnrollment = action.payload.enrollment;

        if (updatedEnrollment) {
          const index = state.items.findIndex(item => item._id === updatedEnrollment._id);
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...updatedEnrollment };
          }

          if (state.dashboardCourses) {
            const dashIndex = state.dashboardCourses.findIndex(item => item._id === updatedEnrollment._id);
            if (dashIndex !== -1) {
              state.dashboardCourses[dashIndex] = {
                ...state.dashboardCourses[dashIndex],
                endedAt: updatedEnrollment.endedAt,
                extensionCount: updatedEnrollment.extensionCount
              };
            }
          }
        }
      })
      .addCase(extendEnrollmentThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetEnrollment, addEnrolledCourseId } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;