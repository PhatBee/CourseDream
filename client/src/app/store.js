import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice';
import courseReducer from '../features/course/courseSlice';
import wishlistReducer from '../features/wishlist/wishlistSlice';
import categoryReducer from '../features/categories/categorySlice';
import cartReducer from '../features/cart/cartSlice';

export const store = configureStore({
  reducer: {
    // Add your reducers here
    auth: authReducer,
    categories: categoryReducer,
    course: courseReducer,
    wishlist: wishlistReducer,
    cart: cartReducer,
  }
});
