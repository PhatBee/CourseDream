import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import courseService from './courseService';
import { courseApi } from '../../api/courseApi';

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
  instructorPagination: { page: 1, limit: 9, totalPages: 1, total: 0 }
};

export const getAllCourses = createAsyncThunk(
  'courses/getAll',
  async (params, thunkAPI) => {
    try {
      const response = await courseApi.getAllCourses(params);
      return response.data;
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
      const response = await courseApi.createCourse(formData);
      return response.data;
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
      const response = await courseApi.getInstructorCourses(params);
      return response.data; // { success, data: { courses, stats, pagination } }
    } catch (error) {
      const message = error.response?.data?.message || 'Error fetching courses';
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
      });
  },
});

export const { resetCourse } = courseSlice.actions;
export default courseSlice.reducer;