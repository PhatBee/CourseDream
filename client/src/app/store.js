import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice';
import courseReducer from '../features/course/courseSlice';
import wishlistReducer from '../features/wishlist/wishlistSlice';


export const store = configureStore({
  reducer: {
    // Add your reducers here
    auth: authReducer,
    course: courseReducer,
    wishlist: wishlistReducer, 
  }
});
