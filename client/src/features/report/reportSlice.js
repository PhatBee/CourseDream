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

// Lấy danh sách báo cáo (admin)
export const fetchReports = createAsyncThunk(
  "report/fetchReports",
  async (params) => await reportService.fetchReports(params)
);

// Lấy chi tiết báo cáo (admin)
export const fetchReportDetail = createAsyncThunk(
  "report/fetchReportDetail",
  async (id) => await reportService.fetchReportDetail(id)
);

// Xử lý báo cáo (admin)
export const resolveReport = createAsyncThunk(
  "report/resolveReport",
  async ({ id, status, adminNote, action }) =>
    await reportService.resolveReport({ id, status, adminNote, action })
);

const reportSlice = createSlice({
  name: "report",
  initialState: {
    loading: false,
    error: null,
    success: false,
    list: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
    detail: null,
    history: [],
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
      // Gửi báo cáo
      .addCase(sendReport.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(sendReport.fulfilled, (state) => { state.loading = false; state.success = true; })
      .addCase(sendReport.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

      // Lấy danh sách báo cáo
      .addCase(fetchReports.pending, (state) => { state.loading = true; })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        // Nếu backend trả về { data: [...] }
        if (Array.isArray(action.payload.data)) {
          state.list = action.payload.data;
          state.pagination = action.payload.pagination || { page: 1, totalPages: 1, total: 0 };
        }
        // Nếu backend trả về { data: { reports: [...], pagination: {...} } }
        else if (action.payload.data && Array.isArray(action.payload.data.reports)) {
          state.list = action.payload.data.reports;
          state.pagination = action.payload.data.pagination || { page: 1, totalPages: 1, total: 0 };
        } else {
          state.list = [];
          state.pagination = { page: 1, totalPages: 1, total: 0 };
        }
      })
      .addCase(fetchReports.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

      // Lấy chi tiết báo cáo
      .addCase(fetchReportDetail.pending, (state) => { state.loading = true; })
      .addCase(fetchReportDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload.data;
        state.history = action.payload.history || [];
      })
      .addCase(fetchReportDetail.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

      // Xử lý báo cáo
      .addCase(resolveReport.pending, (state) => { state.loading = true; })
      .addCase(resolveReport.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload.data;
      })
      .addCase(resolveReport.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
  },
});

export const { resetReportState } = reportSlice.actions;
export default reportSlice.reducer;