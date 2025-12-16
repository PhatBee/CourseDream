import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as promotionApi from "../../api/promotionApi";
import toast from "react-hot-toast";

export const fetchPromotions = createAsyncThunk(
  "promotion/fetchPromotions",
  async (_, thunkAPI) => {
    try {
      const data = await promotionApi.getPromotions();
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Lỗi khi tải mã giảm giá");
    }
  }
);

export const createPromotion = createAsyncThunk(
  "promotion/createPromotion",
  async (formData, thunkAPI) => {
    try {
      const data = await promotionApi.createPromotion(formData);
      toast.success("Tạo mã giảm giá thành công!");
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Tạo mã giảm giá thất bại");
      return thunkAPI.rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updatePromotion = createAsyncThunk(
  "promotion/updatePromotion",
  async ({ id, formData }, thunkAPI) => {
    try {
      const data = await promotionApi.updatePromotion(id, formData);
      toast.success("Cập nhật mã giảm giá thành công!");
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật mã giảm giá thất bại");
      return thunkAPI.rejectWithValue(err.response?.data?.message);
    }
  }
);

export const deletePromotion = createAsyncThunk(
  "promotion/deletePromotion",
  async (id, thunkAPI) => {
    try {
      await promotionApi.deletePromotion(id);
      toast.success("Đã chuyển mã sang trạng thái không hoạt động");
      return { id };
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa mã giảm giá thất bại");
      return thunkAPI.rejectWithValue(err.response?.data?.message);
    }
  }
);


// --- USER: Preview Promotion (Coupon) ---
export const previewPromotionThunk = createAsyncThunk(
  "promotion/previewPromotion",
  async ({ code, courseId }, thunkAPI) => {
    try {
      const data = await promotionApi.previewPromotion({ code, courseId });
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// --- USER: Commit Promotion (after payment) ---
// You may need to implement commitPromotion in promotionApi.js if not present
export const commitPromotionThunk = createAsyncThunk(
  "promotion/commitPromotion",
  async ({ promotionId }, thunkAPI) => {
    try {
      const data = await promotionApi.commitPromotion({ promotionId });
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// New thunk to fetch available promotions based on course IDs
export const fetchAvailablePromotions = createAsyncThunk(
  "promotion/fetchAvailablePromotions",
  async (courseIds, thunkAPI) => {
    try {
      const data = await promotionApi.getAvailablePromotions(courseIds);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  items: [], // admin list
  isLoading: false,
  error: null,
  // User coupon state
  preview: null, // {discountedPrice, ...}
  previewLoading: false,
  previewError: null,
  commitLoading: false,
  commitError: null,
  commitResult: null,
  // New state for available promotions
  available: [],
  availableLoading: false,
  availableError: null,
};

const promotionSlice = createSlice({
  name: "promotion",
  initialState,
  reducers: {
    clearPreview(state) {
      state.preview = null;
      state.previewError = null;
      state.previewLoading = false;
    },
    clearCommit(state) {
      state.commitResult = null;
      state.commitError = null;
      state.commitLoading = false;
    },
  },
  extraReducers: (builder) => {
    // --- ADMIN CRUD ---
    builder
      .addCase(fetchPromotions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPromotions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchPromotions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createPromotion.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updatePromotion.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deletePromotion.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p._id === action.payload.id);
        if (idx !== -1) state.items.splice(idx, 1);
      });

    // --- USER: Preview Coupon ---
    builder
      .addCase(previewPromotionThunk.pending, (state) => {
        state.previewLoading = true;
        state.previewError = null;
        state.preview = null;
      })
      .addCase(previewPromotionThunk.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.preview = action.payload;
      })
      .addCase(previewPromotionThunk.rejected, (state, action) => {
        state.previewLoading = false;
        state.previewError = action.payload || action.error.message;
      });

    // --- USER: Commit Coupon ---
    builder
      .addCase(commitPromotionThunk.pending, (state) => {
        state.commitLoading = true;
        state.commitError = null;
        state.commitResult = null;
      })
      .addCase(commitPromotionThunk.fulfilled, (state, action) => {
        state.commitLoading = false;
        state.commitResult = action.payload;
      })
      .addCase(commitPromotionThunk.rejected, (state, action) => {
        state.commitLoading = false;
        state.commitError = action.payload || action.error.message;
      });

    // --- Fetch Available Promotions ---
    builder
      .addCase(fetchAvailablePromotions.pending, (state) => {
        state.availableLoading = true;
        state.availableError = null;
      })
      .addCase(fetchAvailablePromotions.fulfilled, (state, action) => {
        state.availableLoading = false;
        state.available = action.payload;
      })
      .addCase(fetchAvailablePromotions.rejected, (state, action) => {
        state.availableLoading = false;
        state.availableError = action.payload;
      });
  },
});

export const { clearPreview, clearCommit } = promotionSlice.actions;
export default promotionSlice.reducer;