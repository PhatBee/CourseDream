import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import cartService from "./cartService";
import { toast } from "react-hot-toast"; // Hoặc thư viện toast bạn đang dùng

const initialState = {
    items: [],
    totalItems: 0,
    totalPrice: 0,
    isLoading: false,
    isError: false,
    message: "",
};

// Thunk: Lấy giỏ hàng (dùng khi user load trang hoặc login)
export const getCart = createAsyncThunk(
    "cart/getCart",
    async (_, thunkAPI) => {
        try {
            return await cartService.getCart();
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Thunk: Thêm vào giỏ hàng
export const addToCart = createAsyncThunk(
    "cart/addToCart",
    async (courseId, thunkAPI) => {
        try {
            return await cartService.addToCart(courseId);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// === THÊM MỚI: Thunk Xóa khóa học ===
export const removeFromCart = createAsyncThunk(
    "cart/removeFromCart",
    async (courseId, thunkAPI) => {
        try {
            return await cartService.removeFromCart(courseId);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// === THÊM MỚI: Thunk Xóa toàn bộ giỏ ===
export const clearCart = createAsyncThunk(
    "cart/clearCart",
    async (_, thunkAPI) => {
        try {
            return await cartService.clearCart();
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        resetCart: (state) => {
            state.items = [];
            state.totalItems = 0;
            state.totalPrice = 0;
            state.isLoading = false;
            state.isError = false;
            state.message = "";
        },
    },
    extraReducers: (builder) => {
        builder
            // === GET CART ===
            .addCase(getCart.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getCart.fulfilled, (state, action) => {
                state.isLoading = false;
                // Backend trả về data: { items, totalItems, total, ... }
                // Dựa trên cart.controller.js
                const cartData = action.payload.data;
                state.items = cartData.items;
                state.totalItems = cartData.totalItems;
                state.totalPrice = cartData.total;
            })
            .addCase(getCart.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })

            // === ADD TO CART ===
            .addCase(addToCart.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(addToCart.fulfilled, (state, action) => {
                state.isLoading = false;
                // Cập nhật lại state giỏ hàng mới nhất từ backend trả về
                const cartData = action.payload.data;
                state.items = cartData.items;
                state.totalItems = cartData.totalItems;
                state.totalPrice = cartData.total;
                toast.success("Đã thêm khóa học vào giỏ hàng!");
            })
            .addCase(addToCart.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                toast.error(action.payload); // Hiển thị lỗi (ví dụ: Course already in cart)
            })
            // === REMOVE FROM CART (MỚI) ===
            // Không xử lý .pending để tránh hiện Spinner toàn trang, tạo cảm giác mượt mà
            .addCase(removeFromCart.fulfilled, (state, action) => {
                const cartData = action.payload.data;
                // Cập nhật trực tiếp state từ dữ liệu backend trả về
                state.items = cartData.items;
                state.totalItems = cartData.totalItems;
                state.totalPrice = cartData.total;
                toast.success("Đã xóa khóa học");
            })
            .addCase(removeFromCart.rejected, (state, action) => {
                toast.error(action.payload || "Lỗi khi xóa khóa học");
            })

            // === CLEAR CART (MỚI) ===
            .addCase(clearCart.fulfilled, (state, action) => {
                const cartData = action.payload.data;
                state.items = cartData.items;
                state.totalItems = cartData.totalItems;
                state.totalPrice = cartData.total;
                toast.success("Đã xóa toàn bộ giỏ hàng");
            })
            .addCase(clearCart.rejected, (state, action) => {
                toast.error(action.payload || "Lỗi khi xóa giỏ hàng");
            });
    },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;