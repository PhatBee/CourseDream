import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from './cartService';

const initialState = {
  items: [],
  totalItems: 0,
  total: 0,
  isLoading: false,
  isError: false,
  message: '',
};

export const getCart = createAsyncThunk('cart/getCart', async (_, thunkAPI) => {
  try {
    return await cartService.getCart();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async (courseId, thunkAPI) => {
  try {
    await cartService.addToCart(courseId);
    return thunkAPI.dispatch(getCart());
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (courseId, thunkAPI) => {
  try {
    await cartService.removeFromCart(courseId);
    return thunkAPI.dispatch(getCart());
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const clearCart = createAsyncThunk('cart/clearCart', async (_, thunkAPI) => {
  try {
    await cartService.clearCart();
    return thunkAPI.dispatch(getCart());
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCart.pending, (state) => { state.isLoading = true; })
      .addCase(getCart.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.items = action.payload.items || [];
          state.totalItems = action.payload.totalItems || 0;
          state.total = action.payload.total || 0;
        }
      })
      .addCase(getCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export default cartSlice.reducer;