import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice';
import courseReducer from '../features/course/courseSlice';
import wishlistReducer from '../features/wishlist/wishlistSlice';
import categoryReducer from '../features/categories/categorySlice';
import learningReducer from "../features/learning/learningSlice";
import cartReducer from '../features/cart/cartSlice';
import enrollmentReducer from "../features/enrollment/enrollmentSlice";
import adminReducer from '../features/admin/adminSlice';

export const store = configureStore({
  reducer: {
    // Add your reducers here
    auth: authReducer,
    categories: categoryReducer,
    course: courseReducer,
    learning: learningReducer,
    wishlist: wishlistReducer,
    cart: cartReducer,
    enrollment: enrollmentReducer,
    admin: adminReducer,
  }
});
