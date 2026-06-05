import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import promotionService from "./promotionService";

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

const initialState = {
  // User coupon state
  preview: null, // {discountedPrice, ...}
  previewLoading: false,
  previewError: null,
  
  // Available promotions state
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
  },
});

export const { clearPreview } = promotionSlice.actions;
export default promotionSlice.reducer;
