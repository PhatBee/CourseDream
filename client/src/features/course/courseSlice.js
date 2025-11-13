import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import courseService from './courseService';

const initialState = {
  course: null,
  reviews: [],
  reviewCount: 0,
  isLoading: false,
  isError: false,
  message: '',
};

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
      });
  },
});

export const { resetCourse } = courseSlice.actions;
export default courseSlice.reducer;