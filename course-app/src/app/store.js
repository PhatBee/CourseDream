import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice';
import userReducer from '../features/user/userSlice';

import categoryReducer from '../features/categories/categorySlice';
import courseReducer from '../features/course/courseSlice';
import enrollmentReducer from '../features/enrollment/enrollmentSlice';
import wishlistReducer from '../features/wishlist/wishlistSlice';
import learningReducer from '../features/learning/learningSlice'

export const store = configureStore({
    reducer: {
        // Add your reducers here
        auth: authReducer,
        categories: categoryReducer,
        course: courseReducer,
        enrollment: enrollmentReducer,
        wishlist: wishlistReducer,
        user: userReducer,
        learning: learningReducer,
    }
});
