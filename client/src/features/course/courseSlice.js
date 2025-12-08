import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import courseService from './courseService';
import toast from 'react-hot-toast';

const initialState = {
  items: [],
  pagination: {
    page: 1,
    limit: 9,
    totalPages: 1,
    total: 0
  },
  isLoading: false,
  isError: false,
  message: '',
  instructorCourses: [],
  instructorStats: { all: 0, published: 0, pending: 0, draft: 0 },
  instructorPagination: { page: 1, limit: 9, totalPages: 1, total: 0 },
  // Admin state
  adminPendingCourses: [],
  adminPendingPagination: { page: 1, limit: 10, totalPages: 1, total: 0 },
  adminPendingDetail: null,
  adminActionLoading: false
};

export const getAllCourses = createAsyncThunk(
  'courses/getAll',
  async (params, thunkAPI) => {
    try {
      const response = await courseService.getAllCourses(params);
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Error fetching courses';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Async Thunk: Lấy chi tiết khóa học
export const getCourseDetails = createAsyncThunk(
  'course/getDetails',
  async (slug, thunkAPI) => {
    try {
      return await courseService.getDetails(slug);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Thunk: Create Course
export const createNewCourse = createAsyncThunk(
  'course/create',
  async (formData, thunkAPI) => {
    try {
      const response = await courseService.createCourse(formData);
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Error creating course';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Thunk: Get Instructor Courses
export const getInstructorCourses = createAsyncThunk(
  'course/getInstructorCourses',
  async (params, thunkAPI) => {
    try {
      const response = await courseService.getInstructorCourses(params);
      return response; // { success, data: { courses, stats, pagination } }
    } catch (error) {
      const message = error.response?.data?.message || 'Error fetching courses';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Thunk: Delete Course
export const deleteInstructorCourse = createAsyncThunk(
  'course/delete',
  async (id, thunkAPI) => {
    try {
      const response = await courseService.deleteCourse(id); // Gọi qua service frontend
      return { id, ...response }; // Trả về ID để filter khỏi state
    } catch (error) {
      const message = error.response?.data?.message || 'Delete failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const activateInstructorCourse = createAsyncThunk(
  'course/activate',
  async (id, thunkAPI) => {
    try {
      await courseService.activateCourse(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

// ==================== ADMIN THUNKS ====================

// Thunk: Get Pending Courses (Admin)
export const getAdminPendingCourses = createAsyncThunk(
  'course/getAdminPendingCourses',
  async (params, thunkAPI) => {
    try {
      const response = await courseService.getPendingCourses(params);
      return response; // { success, data: { revisions, pagination } }
    } catch (error) {
      const message = error.response?.data?.message || 'Error fetching pending courses';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Thunk: Get Pending Course Detail (Admin)
export const getAdminPendingDetail = createAsyncThunk(
  'course/getAdminPendingDetail',
  async (revisionId, thunkAPI) => {
    try {
      const response = await courseService.getPendingCourseDetail(revisionId);
      return response; // { success, data: { revision, originalCourse, type } }
    } catch (error) {
      const message = error.response?.data?.message || 'Error fetching course detail';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Thunk: Approve Course (Admin)
export const adminApproveCourse = createAsyncThunk(
  'course/adminApproveCourse',
  async (revisionId, thunkAPI) => {
    try {
      const response = await courseService.approveCourse(revisionId);
      toast.success('Khóa học đã được duyệt thành công!');
      return { revisionId, ...response };
    } catch (error) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi duyệt khóa học';
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Thunk: Reject Course (Admin)
export const adminRejectCourse = createAsyncThunk(
  'course/adminRejectCourse',
  async ({ revisionId, reviewMessage }, thunkAPI) => {
    try {
      const response = await courseService.rejectCourse(revisionId, reviewMessage);
      toast.success('Đã từ chối khóa học');
      return { revisionId, ...response };
    } catch (error) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi từ chối';
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    resetCourse: (state) => {
      state.course = null;
      state.reviews = [];
      state.reviewCount = 0;
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCourseDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCourseDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        // API trả về { course, reviews, reviewCount }
        state.course = action.payload.course;
        state.reviews = action.payload.reviews;
        state.reviewCount = action.payload.reviewCount;
      })
      .addCase(getCourseDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.course = null;
      })
      .addCase(getAllCourses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        // Cập nhật items và pagination từ payload backend
        state.items = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(getAllCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.items = [];
      })

      // Create Course Cases
      .addCase(createNewCourse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.message = 'Khóa học đã được tạo thành công!';
      })
      .addCase(createNewCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Get Instructor Courses Cases
      .addCase(getInstructorCourses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInstructorCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        const { courses, stats, pagination } = action.payload.data;
        state.instructorCourses = courses;
        state.instructorStats = stats;
        state.instructorPagination = pagination;
      })
      .addCase(getInstructorCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      .addCase(deleteInstructorCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        const { id, action: deleteAction } = action.payload; // action trả về từ backend: 'deleted', 'hidden', 'archived'

        // Cập nhật lại list mà không cần fetch lại API
        if (deleteAction === 'deleted') {
          // Xóa hẳn khỏi list
          state.instructorCourses = state.instructorCourses.filter(c => c._id !== id);
          state.instructorStats.all -= 1;
          state.instructorStats.draft -= 1; // Giả sử xóa draft
        } else {
          if (deleteAction === 'hidden') {
            state.instructorStats.hidden += 1;
            state.instructorStats.published -= 1;
          } else if (deleteAction === 'archived') {
            state.instructorStats.archived += 1;
            state.instructorStats.published -= 1;
          }
          // Cập nhật status trong list
          state.instructorCourses = state.instructorCourses.map(c => {
            if (c._id === id) {
              return { ...c, status: deleteAction }; // 'hidden' hoặc 'archived'
            }
            return c;
          });
          // (update lại stats object cho chính xác)

        }
        toast.success(action.payload.message);
      })
      .addCase(activateInstructorCourse.fulfilled, (state, action) => {
        state.instructorCourses = state.instructorCourses.map(c =>
          c._id === action.payload ? { ...c, status: 'published' } : c
        );
        state.instructorStats.published += 1;
        state.instructorStats.hidden -= 1;
        toast.success("Khóa học đã được kích hoạt lại!");
      })

      // ==================== ADMIN REDUCERS ====================

      // Get Admin Pending Courses
      .addCase(getAdminPendingCourses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAdminPendingCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminPendingCourses = action.payload.data.revisions;
        state.adminPendingPagination = action.payload.data.pagination;
      })
      .addCase(getAdminPendingCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Get Admin Pending Detail
      .addCase(getAdminPendingDetail.pending, (state) => {
        state.isLoading = true;
        state.adminPendingDetail = null;
      })
      .addCase(getAdminPendingDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminPendingDetail = action.payload.data;
      })
      .addCase(getAdminPendingDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Approve Course
      .addCase(adminApproveCourse.pending, (state) => {
        state.adminActionLoading = true;
      })
      .addCase(adminApproveCourse.fulfilled, (state, action) => {
        state.adminActionLoading = false;
        // Remove from pending list
        state.adminPendingCourses = state.adminPendingCourses.filter(
          c => c._id !== action.payload.revisionId
        );
        state.adminPendingPagination.total -= 1;
      })
      .addCase(adminApproveCourse.rejected, (state, action) => {
        state.adminActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Reject Course
      .addCase(adminRejectCourse.pending, (state) => {
        state.adminActionLoading = true;
      })
      .addCase(adminRejectCourse.fulfilled, (state, action) => {
        state.adminActionLoading = false;
        // Remove from pending list
        state.adminPendingCourses = state.adminPendingCourses.filter(
          c => c._id !== action.payload.revisionId
        );
        state.adminPendingPagination.total -= 1;
      })
      .addCase(adminRejectCourse.rejected, (state, action) => {
        state.adminActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetCourse } = courseSlice.actions;
export default courseSlice.reducer;