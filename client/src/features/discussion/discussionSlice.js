import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import discussionService from "./discussionService";

// Lấy danh sách thảo luận
export const fetchDiscussions = createAsyncThunk(
  "discussion/fetchDiscussions",
  async ({ courseId, lectureId, page = 1, limit = 10 }) => {
    return await discussionService.getDiscussions(
      courseId,
      lectureId,
      page,
      limit,
    );
  },
);

// Thêm thảo luận mới
export const addDiscussion = createAsyncThunk(
  "discussion/addDiscussion",
  async ({ courseId, lectureId, title, content }) => {
    return await discussionService.addDiscussion(
      courseId,
      lectureId,
      title,
      content,
    );
  },
);

// VOTE (Chỉ còn dùng để Vote cho Discussion gốc)
export const voteDiscussion = createAsyncThunk(
  "discussion/voteDiscussion",
  async ({ discussionId, targetType, targetId }) => {
    return await discussionService.voteDiscussion(
      discussionId,
      targetType,
      targetId,
    );
  },
);

// DELETE
export const deleteDiscussion = createAsyncThunk(
  "discussion/deleteDiscussion",
  async (discussionId) => {
    await discussionService.deleteDiscussion(discussionId);
    return discussionId;
  },
);

const discussionSlice = createSlice({
  name: "discussion",
  initialState: {
    discussions: [],
    pagination: {},
    loading: false,
    error: null,
  },
  reducers: {},
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
        state.error = action.error.message;
      })
      .addCase(addDiscussion.fulfilled, (state, action) => {
        // Unshift cái vỏ vào để thấy ngay câu hỏi mới
        state.discussions.unshift(action.payload);
      })
      .addCase(deleteDiscussion.fulfilled, (state, action) => {
        state.discussions = state.discussions.filter(
          (d) => d._id !== action.payload,
        );
      });
  },
});

export default discussionSlice.reducer;
