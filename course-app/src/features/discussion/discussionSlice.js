import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import discussionApi from "../../api/discussionApi";

export const fetchDiscussions = createAsyncThunk(
  "discussion/fetchDiscussions",
  async ({ courseId, lectureId, page = 1, limit = 10 }, thunkAPI) => {
    try {
      const res = await discussionApi.getDiscussions(
        courseId,
        lectureId,
        page,
        limit,
      );
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue("Không thể tải thảo luận");
    }
  },
);

export const addDiscussion = createAsyncThunk(
  "discussion/addDiscussion",
  async ({ courseId, lectureId, title, content }, thunkAPI) => {
    try {
      const res = await discussionApi.addDiscussion(
        courseId,
        lectureId,
        title,
        content,
      );
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Gửi thảo luận thất bại",
      );
    }
  },
);

export const replyDiscussion = createAsyncThunk(
  "discussion/replyDiscussion",
  async ({ discussionId, content }, thunkAPI) => {
    try {
      const res = await discussionApi.replyDiscussion(discussionId, content);
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Gửi trả lời thất bại",
      );
    }
  },
);

export const voteDiscussion = createAsyncThunk(
  "discussion/voteDiscussion",
  async ({ discussionId, targetType, targetId }, thunkAPI) => {
    try {
      const res = await discussionApi.voteDiscussion(
        discussionId,
        targetType,
        targetId,
      );
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue("Vote thất bại");
    }
  },
);

export const deleteDiscussion = createAsyncThunk(
  "discussion/deleteDiscussion",
  async (discussionId, thunkAPI) => {
    try {
      await discussionApi.deleteDiscussion(discussionId);
      return discussionId;
    } catch (err) {
      return thunkAPI.rejectWithValue("Xóa thất bại");
    }
  },
);

const discussionSlice = createSlice({
  name: "discussion",
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscussions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDiscussions.fulfilled, (state, action) => {
        state.loading = false;
        state.discussions = action.payload.discussions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchDiscussions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    // Các reducer cho việc tương tác local (khi tạo mới hoặc vote) - Bạn có thể push payload vào mảng `discussions`
  },
});

export const { resetDiscussionState } = discussionSlice.actions;
export default discussionSlice.reducer;
