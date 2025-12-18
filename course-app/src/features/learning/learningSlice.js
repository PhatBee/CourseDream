import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { learningApi } from '../../api/learningApi';
import Toast from 'react-native-toast-message';

const initialState = {
  course: null,           // Thông tin khóa học
  sections: [],           // Danh sách chương & bài học
  progress: null,         // Tiến độ (các bài đã hoàn thành)
  currentLecture: null,   // Bài học đang xem
  isLoading: false,
  isError: false,
};

// Thunk: Lấy toàn bộ dữ liệu khóa học + Tiến độ
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

// Thunk: Toggle hoàn thành bài học
export const toggleLecture = createAsyncThunk(
  'learning/toggleLecture',
  async ({ courseSlug, lectureId }, thunkAPI) => {
    try {
      const response = await learningApi.toggleLectureCompletion({ courseSlug, lectureId });
      return response.data.data; // Trả về progress mới
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi cập nhật',
        text2: "Không thể cập nhật tiến độ học tập"
      });
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);
// Thunk: Lấy tiến độ học tập
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

export const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    // Action để chuyển bài học
    setCurrentLecture: (state, action) => {
      state.currentLecture = action.payload;
    },
    resetLearning: (state) => {
      state.course = null;
      state.progress = null;
      state.currentLecture = null;
      state.sections = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLearningCourse.pending, (state) => {
        state.isLoading = true;
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
      .addCase(fetchLearningCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
      })
      .addCase(toggleLecture.fulfilled, (state, action) => {
        // Cập nhật lại progress state
        state.progress = action.payload;
      })
      .addCase(fetchProgressData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProgressData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.progress = action.payload;
      })
      .addCase(fetchProgressData.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
      })
  },
});

export const { setCurrentLecture, resetLearning } = learningSlice.actions;
export default learningSlice.reducer;