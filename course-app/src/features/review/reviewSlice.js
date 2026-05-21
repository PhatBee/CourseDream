import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import reviewApi from "../../api/reviewApi";

export const fetchReviews = createAsyncThunk(
  "review/fetchReviews",
  async ({ courseId, params = {} }, thunkAPI) => {
    try {
      const res = await reviewApi.getCourseReviews(courseId, params);
      return res.data; // Server trả về: { data, total, page, limit }
    } catch (err) {
      return thunkAPI.rejectWithValue("Không thể tải đánh giá");
    }
  },
);

export const addReview = createAsyncThunk(
  "review/addReview",
  async ({ courseId, rating, comment }, thunkAPI) => {
    try {
      const res = await reviewApi.addReview(courseId, { rating, comment });
      return res.data.review;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Gửi đánh giá thất bại",
      );
    }
  },
);

export const removeReview = createAsyncThunk(
  "review/removeReview",
  async (reviewId, thunkAPI) => {
    try {
      await reviewApi.deleteReview(reviewId);
      return reviewId;
    } catch (err) {
      return thunkAPI.rejectWithValue("Lỗi khi xóa đánh giá");
    }
  },
);

export const toggleLike = createAsyncThunk(
  "review/toggleLike",
  async (reviewId, thunkAPI) => {
    try {
      const res = await reviewApi.likeReview(reviewId);
      return {
        reviewId,
        likesCount: res.data.likesCount,
        likedUsers: res.data.likedUsers,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue("Lỗi khi tương tác");
    }
  },
);

export const replyToReview = createAsyncThunk(
  "review/replyToReview",
  async ({ reviewId, comment }, thunkAPI) => {
    try {
      const res = await reviewApi.replyReview(reviewId, { comment });
      return res.data.review;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Lỗi gửi phản hồi",
      );
    }
  },
);

const reviewSlice = createSlice({
  name: "review",
  initialState: {
    reviews: [],
    loading: false,
    error: null,
    total: 0,
    success: false,
  },
  reducers: {
    resetReviewState: (state) => {
      state.error = null;
      state.success = false;
    },
  },
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
      .addCase(addReview.fulfilled, (state, action) => {
        const newReview = action.payload;
        const index = state.reviews.findIndex(
          (r) => r.student?._id === newReview.student,
        );
        if (index !== -1) {
          state.reviews[index] = { ...state.reviews[index], ...newReview };
        } else {
          state.reviews.unshift(newReview);
        }
        state.success = true;
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

export const { resetReviewState } = reviewSlice.actions;
export default reviewSlice.reducer;
