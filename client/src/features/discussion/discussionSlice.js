import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import discussionService from "./discussionService";

// Lấy danh sách thảo luận
export const fetchDiscussions = createAsyncThunk(
  "discussion/fetchDiscussions",
  async ({ courseId, page = 1, limit = 10 }) => {
    return await discussionService.getDiscussions(courseId, page, limit);
  }
);

// Thêm thảo luận mới
export const addDiscussion = createAsyncThunk(
  "discussion/addDiscussion",
  async ({ courseId, content }) => {
    return await discussionService.addDiscussion(courseId, content);
  }
);

// Trả lời thảo luận
export const replyDiscussion = createAsyncThunk(
  "discussion/replyDiscussion",
  async ({ discussionId, content }) => {
    return await discussionService.replyDiscussion(discussionId, content);
  }
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
        state.discussions.unshift(action.payload);
      })
      .addCase(replyDiscussion.fulfilled, (state, action) => {
        // Cập nhật lại replies cho discussion tương ứng
        const { discussionId, reply } = action.payload;
        const discussion = state.discussions.find((d) => d._id === discussionId);
        if (discussion) {
          discussion.replies.push(reply);
        }
      });
  },
});

export default discussionSlice.reducer;