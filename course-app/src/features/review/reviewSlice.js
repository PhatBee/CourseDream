import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reviewApi from '../../api/reviewApi';

export const fetchReviews = createAsyncThunk(
  'review/fetchReviews',
  async (courseId, thunkAPI) => {
    try {
      const res = await reviewApi.getCourseReviews(courseId);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue('Không thể tải đánh giá');
    }
  }
);

export const addReview = createAsyncThunk(
  'review/addReview',
  async ({ courseId, rating, comment }, thunkAPI) => {
    try {
      const res = await reviewApi.addReview(courseId, { rating, comment });
      return res.data.review;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Gửi đánh giá thất bại');
    }
  }
);

const reviewSlice = createSlice({
  name: 'review',
  initialState: {
    reviews: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetReviewState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    }
  },
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
        state.error = action.payload;
      })
      .addCase(addReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(addReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  }
});

export const { resetReviewState } = reviewSlice.actions;
export default reviewSlice.reducer;