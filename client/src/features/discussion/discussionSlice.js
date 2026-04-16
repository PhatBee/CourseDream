import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import discussionService from "./discussionService";

// Lấy danh sách thảo luận (ĐÃ CẬP NHẬT THÊM lectureId)
export const fetchDiscussions = createAsyncThunk(
  "discussion/fetchDiscussions",
  async ({ courseId, lectureId, page = 1, limit = 10 }) => {
    // Truyền đầy đủ lectureId vào service
    return await discussionService.getDiscussions(
      courseId,
      lectureId,
      page,
      limit,
    );
  },
);

// Thêm thảo luận mới (ĐÃ CẬP NHẬT THÊM lectureId VÀ title)
export const addDiscussion = createAsyncThunk(
  "discussion/addDiscussion",
  async ({ courseId, lectureId, title, content }) => {
    // Truyền đầy đủ 4 tham số vào service
    return await discussionService.addDiscussion(
      courseId,
      lectureId,
      title,
      content,
    );
  },
);

// Trả lời thảo luận
export const replyDiscussion = createAsyncThunk(
  "discussion/replyDiscussion",
  async ({ discussionId, content }) => {
    return await discussionService.replyDiscussion(discussionId, content);
  },
);

// VOTE
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

// MARK BEST ANSWER
export const markBestAnswer = createAsyncThunk(
  "discussion/markBestAnswer",
  async ({ discussionId, replyId }) => {
    return await discussionService.markBestAnswer(discussionId, replyId);
  },
);

// DELETE
export const deleteDiscussion = createAsyncThunk(
  "discussion/deleteDiscussion",
  async (discussionId) => {
    await discussionService.deleteDiscussion(discussionId);
    return discussionId; // Trả về ID để xóa khỏi mảng trong reducer
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
        state.discussions.unshift(action.payload);
      })
      .addCase(replyDiscussion.fulfilled, (state, action) => {
        // Cập nhật lại replies cho discussion tương ứng
        const { discussionId, reply } = action.payload;
        const discussion = state.discussions.find(
          (d) => d._id === discussionId,
        );
        if (discussion) {
          discussion.replies.push(reply);
        }
      });
  },
});

export default discussionSlice.reducer;
