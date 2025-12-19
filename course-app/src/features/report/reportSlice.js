import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportApi from '../../api/reportApi';

export const sendReport = createAsyncThunk(
  'report/sendReport',
  async ({ type, targetId, reason }, thunkAPI) => {
    try {
      let res;
      if (type === 'course') {
        res = await reportApi.reportCourse(targetId, reason);
      } else if (type === 'discussion') {
        res = await reportApi.reportDiscussion(targetId, reason);
      } else if (type === 'reply') {
        res = await reportApi.reportReply(targetId, reason);
      }
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Gửi báo cáo thất bại');
    }
  }
);

const reportSlice = createSlice({
  name: 'report',
  initialState: {
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetReportState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendReport.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(sendReport.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(sendReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  }
});

export const { resetReportState } = reportSlice.actions;
export default reportSlice.reducer;