import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import reviewService from "./reviewService";

// Lấy danh sách review cho 1 khóa học
export const fetchReviews = createAsyncThunk(
  "review/fetchReviews",
  async ({ courseId, params = {} }) => {
    return await reviewService.getReviews(courseId, params);
  },
);

// Thêm review mới
export const addReview = createAsyncThunk(
  "review/addReview",
  async ({ courseId, data }) => {
    return await reviewService.addReview(courseId, data);
  },
);

//Xóa review
export const removeReview = createAsyncThunk(
  "review/removeReview",
  async (reviewId) => {
    await reviewService.deleteReview(reviewId);
    return reviewId;
  },
);

//Like review
export const toggleLike = createAsyncThunk(
  "review/toggleLike",
  async (reviewId) => {
    const res = await reviewService.likeReview(reviewId);
    return { reviewId, likesCount: res.likesCount, likedUsers: res.likedUsers };
  },
);

// Instructor trả lời
export const replyToReview = createAsyncThunk(
  "review/replyToReview",
  async ({ reviewId, comment }) => {
    const res = await reviewService.replyReview(reviewId, { comment });
    return res.review;
  },
);

const reviewSlice = createSlice({
  name: "review",
  initialState: {
    reviews: [],
    total: 0,
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
        state.reviews = action.payload.data || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        // Cập nhật lại UI sau khi Add/Update
        const newReview = action.payload.review;
        const studentId = newReview.student?._id || newReview.student;
        const index = state.reviews.findIndex(
          (r) => (r.student?._id || r.student) === studentId,
        );
        if (index !== -1) {
          // Xóa review cũ nếu update
          state.reviews.splice(index, 1);
        }
        // Thêm bổ sung object với logic populate tạm
        state.reviews.unshift(newReview);
      })
      .addCase(removeReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter((r) => r._id !== action.payload);
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const review = state.reviews.find(
          (r) => r._id === action.payload.reviewId,
        );
        if (review) {
          review.likesCount = action.payload.likesCount;
          review.likedUsers = action.payload.likedUsers;
        }
      })
      .addCase(replyToReview.fulfilled, (state, action) => {
        const index = state.reviews.findIndex(
          (r) => r._id === action.payload._id,
        );
        if (index !== -1) {
          state.reviews[index].instructorReply = action.payload.instructorReply;
        }
      });
  },
});

export default reviewSlice.reducer;
