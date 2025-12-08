import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import reviewService from "./reviewService";

// Lấy danh sách review cho 1 khóa học
export const fetchReviews = createAsyncThunk(
  "review/fetchReviews",
  async (courseId) => {
    return await reviewService.getReviews(courseId);
  }
);

// Thêm review mới
export const addReview = createAsyncThunk(
  "review/addReview",
  async ({ courseId, data }) => {
    return await reviewService.addReview(courseId, data);
  }
);

const reviewSlice = createSlice({
  name: "review",
  initialState: {
    reviews: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.reviews.unshift(action.payload);
      });
  },
});

export default reviewSlice.reducer;