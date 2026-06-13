import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { learningApi } from '../../api/learningApi';
import Toast from 'react-native-toast-message';

const initialState = {
  course: null,           // Thông tin khóa học
  sections: [],           // Danh sách chương & bài học
  progress: null,         // Tiến độ (các bài đã hoàn thành)
  currentLecture: null,   // Bài học đang xem
  // ─── Video progress tracking ───────────────────────────────────────────────
  lastWatchedTime: 0,     // last_watched_time của bài đang xem (giây)
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
      Toast.show({
        type: 'error',
        text1: 'Lỗi cập nhật',
        text2: 'Không thể cập nhật tiến độ học tập',
      });
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// ─── Thunk: Lấy tiến độ học tập ──────────────────────────────────────────────
export const fetchProgressData = createAsyncThunk(
  'learning/fetchProgress',
  async (slug, thunkAPI) => {
    try {
      const response = await learningApi.getProgress(slug);
      return response.data.data;
    } catch (error) {
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

// ─── Slice ────────────────────────────────────────────────────────────────────
export const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    setCurrentLecture: (state, action) => {
      state.currentLecture = action.payload;
      state.lastWatchedTime = 0; // Reset khi chuyển bài
    },
    resetLearning: (state) => {
      state.course = null;
      state.progress = null;
      state.currentLecture = null;
      state.sections = [];
      state.lastWatchedTime = 0;
    },
    setLastWatchedTime: (state, action) => {
      state.lastWatchedTime = action.payload;
    },
    markQuizComplete: (state, action) => {
      const { lectureId, quizIndex } = action.payload;
      if (!state.progress) {
        state.progress = { completedLectures: [], completedQuizzes: [], percentage: 0 };
      }
      if (!state.progress.completedQuizzes) {
        state.progress.completedQuizzes = [];
      }
      const exists = state.progress.completedQuizzes.some(
        q => String(q.lectureId) === String(lectureId) && q.quizIndex === quizIndex
      );
      if (!exists) {
        state.progress.completedQuizzes.push({
          lectureId,
          quizIndex,
          answeredAt: new Date().toISOString()
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchLearningCourse
      .addCase(fetchLearningCourse.pending, (state) => {
        state.isLoading = true;
        state.lastWatchedTime = 0;
      })
      .addCase(fetchLearningCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.course = action.payload.course;
        state.sections = action.payload.course.sections || [];
        state.progress = action.payload.progress;

        // Mặc định chọn bài đầu tiên nếu chưa chọn
        if (!state.currentLecture && state.sections.length > 0) {
          const firstLecture = state.sections[0].lectures?.[0];
          if (firstLecture) state.currentLecture = firstLecture;
        }
      })
      .addCase(fetchLearningCourse.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })

      // toggleLecture
      .addCase(toggleLecture.fulfilled, (state, action) => {
        state.progress = action.payload;
      })

      // fetchProgressData
      .addCase(fetchProgressData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProgressData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.progress = action.payload;
      })
      .addCase(fetchProgressData.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })

      // fetchVideoProgress — set lastWatchedTime khi mở bài
      .addCase(fetchVideoProgress.fulfilled, (state, action) => {
        state.lastWatchedTime = action.payload?.watchedSeconds ?? 0;
      })
      .addCase(fetchVideoProgress.rejected, (state) => {
        state.lastWatchedTime = 0;
      })

      // saveVideoProgress — silent update
      .addCase(saveVideoProgress.fulfilled, (state, action) => {
        state.lastWatchedTime = action.payload?.watchedSeconds ?? state.lastWatchedTime;
      });
  },
});

export const { setCurrentLecture, resetLearning, setLastWatchedTime, markQuizComplete } = learningSlice.actions;
export default learningSlice.reducer;