import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminService } from './adminService';
import toast from 'react-hot-toast';

const initialState = {
    isLoading: false,
    isError: false,
    message: '',
    adminPendingCourses: [],
    adminPendingPagination: { page: 1, limit: 10, totalPages: 1, total: 0 },
    adminPendingDetail: null,
    adminActionLoading: false
};

// Thunk: Get Pending Courses (Admin)
export const getAdminPendingCourses = createAsyncThunk(
    'admin/getAdminPendingCourses',
    async (params, thunkAPI) => {
        try {
            const response = await adminService.getPendingCourses(params);
            return response; // { success, data: { revisions, pagination } }
        } catch (error) {
            const message = error.response?.data?.message || 'Error fetching pending courses';
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Thunk: Get Pending Course Detail (Admin)
export const getAdminPendingDetail = createAsyncThunk(
    'admin/getAdminPendingDetail',
    async (revisionId, thunkAPI) => {
        try {
            const response = await adminService.getPendingCourseDetail(revisionId);
            return response; // { success, data: { revision, originalCourse, type } }
        } catch (error) {
            const message = error.response?.data?.message || 'Error fetching course detail';
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Thunk: Approve Course (Admin)
export const adminApproveCourse = createAsyncThunk(
    'admin/adminApproveCourse',
    async (revisionId, thunkAPI) => {
        try {
            const response = await adminService.approveCourse(revisionId);
            toast.success('Khóa học đã được duyệt thành công!');
            return { revisionId, ...response };
        } catch (error) {
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi duyệt khóa học';
            toast.error(message);
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Thunk: Reject Course (Admin)
export const adminRejectCourse = createAsyncThunk(
    'admin/adminRejectCourse',
    async ({ revisionId, reviewMessage }, thunkAPI) => {
        try {
            const response = await adminService.rejectCourse(revisionId, reviewMessage);
            toast.success('Đã từ chối khóa học');
            return { revisionId, ...response };
        } catch (error) {
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi từ chối';
            toast.error(message);
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        resetAdminState: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            // Get Admin Pending Courses
            .addCase(getAdminPendingCourses.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAdminPendingCourses.fulfilled, (state, action) => {
                state.isLoading = false;
                state.adminPendingCourses = action.payload.data.revisions;
                state.adminPendingPagination = action.payload.data.pagination;
            })
            .addCase(getAdminPendingCourses.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Get Admin Pending Detail
            .addCase(getAdminPendingDetail.pending, (state) => {
                state.isLoading = true;
                state.adminPendingDetail = null;
            })
            .addCase(getAdminPendingDetail.fulfilled, (state, action) => {
                state.isLoading = false;
                state.adminPendingDetail = action.payload.data;
            })
            .addCase(getAdminPendingDetail.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Approve Course
            .addCase(adminApproveCourse.pending, (state) => {
                state.adminActionLoading = true;
            })
            .addCase(adminApproveCourse.fulfilled, (state, action) => {
                state.adminActionLoading = false;
                // Remove from pending list
                state.adminPendingCourses = state.adminPendingCourses.filter(
                    c => c._id !== action.payload.revisionId
                );
                state.adminPendingPagination.total -= 1;
            })
            .addCase(adminApproveCourse.rejected, (state, action) => {
                state.adminActionLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // Reject Course
            .addCase(adminRejectCourse.pending, (state) => {
                state.adminActionLoading = true;
            })
            .addCase(adminRejectCourse.fulfilled, (state, action) => {
                state.adminActionLoading = false;
                // Remove from pending list
                state.adminPendingCourses = state.adminPendingCourses.filter(
                    c => c._id !== action.payload.revisionId
                );
                state.adminPendingPagination.total -= 1;
            })
            .addCase(adminRejectCourse.rejected, (state, action) => {
                state.adminActionLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { resetAdminState } = adminSlice.actions;
export default adminSlice.reducer;
