import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  apiError: null, // { status: number, message: string, timestamp: number }
};

const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    setApiError: (state, action) => {
      state.apiError = {
        status: action.payload.status,
        message: action.payload.message || '',
        timestamp: Date.now(),
      };
    },
    clearApiError: (state) => {
      state.apiError = null;
    },
  },
});

export const { setApiError, clearApiError } = errorSlice.actions;
export default errorSlice.reducer;
