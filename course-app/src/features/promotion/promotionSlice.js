import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import promotionService from "./promotionService";
import paymentService from "../payment/paymentService";

// --- USER: Preview Promotion (Coupon) ---
export const previewPromotionThunk = createAsyncThunk(
  "promotion/previewPromotion",
  async ({ code, courseIds }, thunkAPI) => {
    try {
      const data = await promotionService.previewPromotion({ code, courseIds });
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch available promotions based on course IDs
export const fetchAvailablePromotions = createAsyncThunk(
  "promotion/fetchAvailablePromotions",
  async (courseIds, thunkAPI) => {
    try {
      const data = await promotionService.getAvailablePromotions(courseIds);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch Tiered Discount Preview
export const fetchTieredPreview = createAsyncThunk(
  "promotion/fetchTieredPreview",
  async (courseIds, thunkAPI) => {
    try {
      // paymentService.previewDiscount đã unwrap response.data rồi
      // nên ta return trực tiếp (KHÔNG thêm .data nữa)
      const data = await paymentService.previewDiscount(courseIds);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch student completion reward vouchers
export const fetchMyRewardVouchers = createAsyncThunk(
  "promotion/fetchMyRewardVouchers",
  async (_, thunkAPI) => {
    try {
      const data = await promotionService.getMyRewardVouchers();
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  // User coupon state
  preview: null,
  previewLoading: false,
  previewError: null,

  // Available promotions state
  available: [],
  availableLoading: false,
  availableError: null,

  // Tiered discount preview
  tieredPreview: null,
  tieredLoading: false,
  tieredError: null,

  // User override: force use coupon even if tiered is better
  forceCoupon: false,

  // Reward vouchers state
  myRewards: [],
  myRewardsLoading: false,
  myRewardsError: null,
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
    setForceCoupon(state, action) {
      state.forceCoupon = action.payload;
    },
  },
  extraReducers: (builder) => {
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

    // --- Tiered Preview ---
    builder
      .addCase(fetchTieredPreview.pending, (state) => {
        state.tieredLoading = true;
        state.tieredError = null;
      })
      .addCase(fetchTieredPreview.fulfilled, (state, action) => {
        state.tieredLoading = false;
        state.tieredPreview = action.payload;
      })
      .addCase(fetchTieredPreview.rejected, (state, action) => {
        state.tieredLoading = false;
        state.tieredError = action.payload;
      });

    // --- USER: Fetch My Reward Vouchers ---
    builder
      .addCase(fetchMyRewardVouchers.pending, (state) => {
        state.myRewardsLoading = true;
        state.myRewardsError = null;
      })
      .addCase(fetchMyRewardVouchers.fulfilled, (state, action) => {
        state.myRewardsLoading = false;
        state.myRewards = action.payload;
      })
      .addCase(fetchMyRewardVouchers.rejected, (state, action) => {
        state.myRewardsLoading = false;
        state.myRewardsError = action.payload;
      });
  },
});

export const { clearPreview, setForceCoupon } = promotionSlice.actions;
export default promotionSlice.reducer;
