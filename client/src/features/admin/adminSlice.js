import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminService } from './adminService';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

const initialState = {
    stats: null,          // Dữ liệu tổng quan (counts, top courses...)
    revenueData: null,    // Dữ liệu biểu đồ doanh thu
    isLoading: false,
    isError: false,
    message: '',
    adminPendingCourses: [],
    adminPendingPagination: { page: 1, limit: 10, totalPages: 1, total: 0 },
    adminPendingDetail: null,
    adminActionLoading: false,
    studentsList: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    },
    instructorsList: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    },

};

// 1. Thunk: Lấy số liệu tổng quan
export const fetchDashboardStats = createAsyncThunk(
    'admin/fetchDashboardStats',
    async (_, thunkAPI) => {
        try {
            const response = await adminApi.getDashboardStats();
            return response.data.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Error fetching stats');
        }
    }
);

// 2. Thunk: Lấy biểu đồ doanh thu
export const fetchRevenueAnalytics = createAsyncThunk(
    'admin/fetchRevenueAnalytics',
    async (type, thunkAPI) => {
        try {
            const response = await adminApi.getRevenueAnalytics(type);
            return response.data.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Error fetching revenue');
        }
    }
);

export const fetchStudents = createAsyncThunk(
    'admin/fetchStudents',
    async (params, thunkAPI) => {
        try {
            const response = await adminApi.getStudents(params);
            return response.data.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message);
        }
    }
);

export const fetchInstructors = createAsyncThunk(
    'admin/fetchInstructors',
    async (params, thunkAPI) => {
        try {
            const response = await adminApi.getInstructors(params);
            return response.data.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message);
        }
    }
);

export const toggleBlockUser = createAsyncThunk(
    'admin/toggleBlockUser',
    async ({ userId, reason }, thunkAPI) => {
        try {
            const response = await adminApi.toggleBlockUser(userId, reason);
            const isBlocked = !response.data.data.isActive;

            return {
                userId,
                isBlocked,
                message: response.data.message
            };
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message);
        }
    }
);

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

const adminSlice = createSlice({
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
            // Dashboard Stats
            .addCase(fetchDashboardStats.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.isLoading = false;
                state.stats = action.payload;
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Revenue Analytics
            .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
                state.revenueData = action.payload;
            })
            .addCase(fetchStudents.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchStudents.fulfilled, (state, action) => {
                state.isLoading = false;
                state.studentsList.data = action.payload.students;
                state.studentsList.pagination = action.payload.pagination;
            })

            .addCase(fetchInstructors.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchInstructors.fulfilled, (state, action) => {
                state.isLoading = false;
                state.instructorsList.data = action.payload.instructors;
                state.instructorsList.pagination = action.payload.pagination;
            })
            .addCase(toggleBlockUser.fulfilled, (state, action) => {
                const { userId, isBlocked } = action.payload;

                const student = state.studentsList.data.find(u => u._id === userId);
                if (student) student.isBlocked = isBlocked;

                const instructor = state.instructorsList.data.find(u => u._id === userId);
                if (instructor) instructor.isBlocked = isBlocked;
            })
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
