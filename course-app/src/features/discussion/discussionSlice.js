import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import discussionApi from '../../api/discussionApi';

export const fetchDiscussions = createAsyncThunk(
  'discussion/fetchDiscussions',
  async ({ courseId, page = 1, limit = 10 }, thunkAPI) => {
    try {
      const res = await discussionApi.getDiscussions(courseId, page, limit);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue('Không thể tải thảo luận');
    }
  }
);

export const addDiscussion = createAsyncThunk(
  'discussion/addDiscussion',
  async ({ courseId, content }, thunkAPI) => {
    try {
      const res = await discussionApi.addDiscussion(courseId, content);
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Gửi thảo luận thất bại');
    }
  }
);

export const replyDiscussion = createAsyncThunk(
  'discussion/replyDiscussion',
  async ({ discussionId, content }, thunkAPI) => {
    try {
      const res = await discussionApi.replyDiscussion(discussionId, content);
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Gửi trả lời thất bại');
    }
  }
);

const discussionSlice = createSlice({
  name: 'discussion',
  initialState: {
    discussions: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetDiscussionState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscussions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscussions.fulfilled, (state, action) => {
        state.loading = false;
        state.discussions = action.payload.discussions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchDiscussions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addDiscussion.fulfilled, (state, action) => {
        state.success = true;
      })
      .addCase(replyDiscussion.fulfilled, (state, action) => {
        state.success = true;
      });
  }
});

export const { resetDiscussionState } = discussionSlice.actions;
export default discussionSlice.reducer;