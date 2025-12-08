import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import reportService from "./reportService";

// Gửi báo cáo
export const sendReport = createAsyncThunk(
  "report/sendReport",
  async ({ type, targetId, reason }) => {
    if (type === "course") return await reportService.reportCourse(targetId, reason);
    if (type === "discussion") return await reportService.reportDiscussion(targetId, reason);
    if (type === "reply") return await reportService.reportReply(targetId, reason);
    throw new Error("Invalid report type");
  }
);

const reportSlice = createSlice({
  name: "report",
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
        state.error = action.error.message;
      });
  },
});

export const { resetReportState } = reportSlice.actions;
export default reportSlice.reducer;