import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { learningApi } from '../../api/learningApi';
import { toast } from 'react-toastify';

const initialState = {
  course: null,           // Thông tin khóa học
  sections: [],           // Danh sách chương & bài học
  progress: null,         // Tiến độ (các bài đã hoàn thành)
  currentLecture: null,   // Bài học đang xem
  // ─── Video progress tracking ───────────────────────────────────────────────
  lastWatchedTime: 0,     // last_watched_time của bài đang xem (giây)
  // ─── Interactive Quiz state ───────────────────────────────────────────
  completedQuizzes: [],   // [{ lectureId, quizIndex, selectedAnswer, isCorrect, attempts }]
  activeQuiz: null,       // { quizIndex, quiz } — quiz đang hiển thị
  quizBlocked: false,     // Video đang bị block bởi quiz
  // ─── Quiz Review Mode ─────────────────────────────────────────────────
  quizReviewData: [],     // Dữ liệu review: câu hỏi + đáp án đúng + attempt history
  isLoadingReview: false, // Loading state riêng cho review modal
  isLoading: false,
  isError: false,
};

// ─── Thunk: Lấy toàn bộ dữ liệu khóa học + Tiến độ ─────────────────────────
export const fetchLearningCourse = createAsyncThunk(
  'learning/fetchCourse',
  async (slug, thunkAPI) => {
    try {
      const response = await learningApi.getCourseContent(slug);
      if (response.course) return response;
      if (response.data && response.data.course) return response.data;
      return response.data?.data || {};
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// ─── Thunk: Toggle hoàn thành bài học ────────────────────────────────────────
export const toggleLecture = createAsyncThunk(
  'learning/toggleLecture',
  async ({ courseSlug, lectureId }, thunkAPI) => {
    try {
      const response = await learningApi.toggleLectureCompletion({ courseSlug, lectureId });
      return response.data.data;
    } catch (error) {
      toast.error("Không thể cập nhật tiến độ");
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// ─── Thunk: Lấy last_watched_time của bài giảng ──────────────────────────────
export const fetchVideoProgress = createAsyncThunk(
  'learning/fetchVideoProgress',
  async ({ courseSlug, lectureId }, thunkAPI) => {
    try {
      const response = await learningApi.getVideoProgress(courseSlug, lectureId);
      return response.data.data; // { lectureId, watchedSeconds }
    } catch (error) {
      // Không toast lỗi vì đây là background fetch
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// ─── Thunk: Lưu tiến độ xem video (gọi mỗi 10s) ─────────────────────────────
export const saveVideoProgress = createAsyncThunk(
  'learning/saveVideoProgress',
  async ({ courseSlug, lectureId, watchedSeconds }, thunkAPI) => {
    try {
      await learningApi.saveVideoProgress({ courseSlug, lectureId, watchedSeconds });
      return { watchedSeconds };
    } catch (error) {
      // Silent fail — không làm phiền user khi lưu định kỳ thất bại
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// ─── Thunk: Lấy dữ liệu Review Mode (quiz + đáp án đúng + lịch sử làm bài) ──
export const fetchQuizReview = createAsyncThunk(
  'learning/fetchQuizReview',
  async ({ courseSlug, lectureId }, thunkAPI) => {
    try {
      const response = await learningApi.getQuizReview(courseSlug, lectureId);
      return response.data.data; // { reviewData, lectureId }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
export const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    setCurrentLecture: (state, action) => {
      state.currentLecture = action.payload;
      state.lastWatchedTime = 0; // Reset khi chuyển bài
      // Reset quiz state khi chuyển bài
      state.activeQuiz = null;
      state.quizBlocked = false;
    },
    resetLearning: (state) => {
      state.course = null;
      state.progress = null;
      state.currentLecture = null;
      state.sections = [];
      state.lastWatchedTime = 0;
      state.completedQuizzes = [];
      state.activeQuiz = null;
      state.quizBlocked = false;
    },
    /** Cập nhật lastWatchedTime cục bộ (dùng cho UI, không gọi API) */
    setLastWatchedTime: (state, action) => {
      state.lastWatchedTime = action.payload;
    },
    // ─── Quiz reducers ────────────────────────────────────────────────────────
    /** Hiển thị quiz overlay và block video */
    showQuiz: (state, action) => {
      // action.payload: { quizIndex, quiz }
      state.activeQuiz = action.payload;
      state.quizBlocked = true;
    },
    /** Đóng quiz overlay (không dùng trực tiếp — chỉ khi admin deactivate) */
    dismissQuiz: (state) => {
      state.activeQuiz = null;
      state.quizBlocked = false;
    },
    /** Đánh dấu quiz đã hoàn thành đúng, resume video */
    markQuizComplete: (state, action) => {
      // action.payload: { lectureId, quizIndex, selectedAnswer }
      const { lectureId, quizIndex, selectedAnswer } = action.payload;
      const existingIdx = state.completedQuizzes.findIndex(
        q => String(q.lectureId) === String(lectureId) && q.quizIndex === quizIndex
      );
      if (existingIdx >= 0) {
        // Update existing entry
        state.completedQuizzes[existingIdx].isCorrect = true;
        state.completedQuizzes[existingIdx].selectedAnswer = selectedAnswer || '';
        state.completedQuizzes[existingIdx].attempts = (state.completedQuizzes[existingIdx].attempts || 0) + 1;
      } else {
        state.completedQuizzes.push({
          lectureId,
          quizIndex,
          selectedAnswer: selectedAnswer || '',
          isCorrect: true,
          attempts: 1,
        });
      }
      // ✅ FIX: Mở khóa ngay lập tức sau khi trả lời đúng
      state.activeQuiz = null;
      state.quizBlocked = false;
    },
    /** Remove 1 quiz khỏi completedQuizzes (cho reset/retake) */
    removeQuizComplete: (state, action) => {
      const { lectureId, quizIndex } = action.payload;
      state.completedQuizzes = state.completedQuizzes.filter(
        q => !(String(q.lectureId) === String(lectureId) && q.quizIndex === quizIndex)
      );
    },
    /** Remove tất cả quiz của 1 lecture khỏi completedQuizzes */
    removeAllQuizzesForLecture: (state, action) => {
      const { lectureId } = action.payload;
      state.completedQuizzes = state.completedQuizzes.filter(
        q => String(q.lectureId) !== String(lectureId)
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchLearningCourse
      .addCase(fetchLearningCourse.pending, (state) => {
        state.isLoading = true;
        state.currentLecture = null;
        state.lastWatchedTime = 0;
      })
      .addCase(fetchLearningCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.course = action.payload.course;
        state.sections = action.payload.course.sections || [];
        state.progress = action.payload.progress;
        state.currentLecture = null;
        // Load danh sách quiz đã hoàn thành từ server (chỉ lấy quiz đúng cho seek-block)
        const allQuizzes = action.payload.progress?.completedQuizzes || [];
        state.completedQuizzes = allQuizzes;
      })

      .addCase(fetchLearningCourse.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })

      // toggleLecture
      .addCase(toggleLecture.fulfilled, (state, action) => {
        state.progress = action.payload;
      })

      // fetchVideoProgress — set lastWatchedTime khi mở bài
      .addCase(fetchVideoProgress.fulfilled, (state, action) => {
        state.lastWatchedTime = action.payload?.watchedSeconds ?? 0;
      })
      .addCase(fetchVideoProgress.rejected, (state) => {
        state.lastWatchedTime = 0;
      })

      // saveVideoProgress — cập nhật lastWatchedTime local (tùy chọn)
      .addCase(saveVideoProgress.fulfilled, (state, action) => {
        // Có thể cập nhật lastWatchedTime từ response nếu cần
      })

      // fetchQuizReview — load dữ liệu cho Review Modal
      .addCase(fetchQuizReview.pending, (state) => {
        state.isLoadingReview = true;
      })
      .addCase(fetchQuizReview.fulfilled, (state, action) => {
        state.isLoadingReview = false;
        state.quizReviewData = action.payload?.reviewData || [];
      })
      .addCase(fetchQuizReview.rejected, (state) => {
        state.isLoadingReview = false;
        state.quizReviewData = [];
      });
  },
});

export const {
  setCurrentLecture,
  resetLearning,
  setLastWatchedTime,
  showQuiz,
  dismissQuiz,
  markQuizComplete,
  removeQuizComplete,
  removeAllQuizzesForLecture,
} = learningSlice.actions;
export default learningSlice.reducer;