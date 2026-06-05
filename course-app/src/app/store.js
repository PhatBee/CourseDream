import { configureStore } from "@reduxjs/toolkit";
import { setStore } from './storeHolder';
import authReducer from '../features/auth/authSlice';
import userReducer from '../features/user/userSlice';
import instructorReducer from '../features/instructor/instructorSlice';

import categoryReducer from '../features/categories/categorySlice';
import courseReducer from '../features/course/courseSlice';
import enrollmentReducer from '../features/enrollment/enrollmentSlice';
import wishlistReducer from '../features/wishlist/wishlistSlice';
import learningReducer from '../features/learning/learningSlice'
import cartReducer from '../features/cart/cartSlice';
import reviewReducer from '../features/review/reviewSlice';
import discussionReducer from '../features/discussion/discussionSlice';
import reportReducer from '../features/report/reportSlice';
import notificationReducer from '../features/notification/notificationSlice';
import promotionReducer from '../features/promotion/promotionSlice';

export const store = configureStore({
        reducer: {
                // Add your reducers here
                auth: authReducer,
                categories: categoryReducer,
                course: courseReducer,
                enrollment: enrollmentReducer,
                wishlist: wishlistReducer,
                user: userReducer,
                instructor: instructorReducer,
                cart: cartReducer,
                learning: learningReducer,
                review: reviewReducer,
                discussion: discussionReducer,
                report: reportReducer,
                notification: notificationReducer,
                promotion: promotionReducer,
        }
});

// Inject store vào storeHolder để axiosClient dùng lazy (tránh require cycle)
// Phải gọi ngay sau configureStore, trước khi bất kỳ request nào xảy ra
setStore(store);
