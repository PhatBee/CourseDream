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
  instructorPagination: { page: 1, limit: 9, totalPages: 1, total: 0 }
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

      .addCase(deleteInstructorCourse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteInstructorCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        const { id, action: deleteAction } = action.payload;

        if (deleteAction === 'deleted') {
          // Standalone draft revision — _id === revisionId === card._id
          state.instructorCourses = state.instructorCourses.filter(c => c._id !== id);
          state.instructorStats.all = Math.max(0, (state.instructorStats.all || 0) - 1);
          state.instructorStats.draft = Math.max(0, (state.instructorStats.draft || 0) - 1);
        } else if (deleteAction === 'revision_deleted') {
          // Case D: revision của published course — cần xóa revisionId khỏi card (hoặc refetch)
          // Vì card._id = courseId, lọc qua revisionId
          state.instructorCourses = state.instructorCourses.map(c =>
            c.revisionId?.toString() === id?.toString()
              ? { ...c, revisionStatus: null, revisionId: null, reviewMessage: null }
              : c
          );
          // Stats sẽ được cập nhật chính xác sau khi refetch getInstructorCourses
        } else if (deleteAction === 'hidden') {
          state.instructorStats.hidden = (state.instructorStats.hidden || 0) + 1;
          state.instructorStats.published = Math.max(0, (state.instructorStats.published || 0) - 1);
          state.instructorCourses = state.instructorCourses.map(c =>
            c._id === id ? { ...c, status: 'hidden' } : c
          );
        } else if (deleteAction === 'archived') {
          state.instructorStats.archived = (state.instructorStats.archived || 0) + 1;
          state.instructorStats.published = Math.max(0, (state.instructorStats.published || 0) - 1);
          state.instructorCourses = state.instructorCourses.map(c =>
            c._id === id ? { ...c, status: 'archived' } : c
          );
        }
        toast.success(action.payload.message);
      })
      .addCase(deleteInstructorCourse.rejected, (state, action) => {
        state.isLoading = false;
        toast.error(action.payload || 'Xóa thất bại. Vui lòng thử lại.');
      })
      .addCase(activateInstructorCourse.fulfilled, (state, action) => {
        state.instructorCourses = state.instructorCourses.map(c =>
          c._id === action.payload ? { ...c, status: 'published' } : c
        );
        state.instructorStats.published += 1;
        state.instructorStats.hidden -= 1;
        toast.success("Khóa học đã được kích hoạt lại!");
      })
  },
});

export const { resetCourse } = courseSlice.actions;
export default courseSlice.reducer;