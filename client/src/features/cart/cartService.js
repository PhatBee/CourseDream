import cartApi from "../../api/cartApi";

const getCart = async () => {
    const response = await cartApi.getCart();
    return response.data;
};

const addToCart = async (courseId) => {
    const response = await cartApi.addToCart({ courseId });
    return response.data;
};

const removeFromCart = async (courseId) => {
    const response = await cartApi.removeFromCart(courseId);
    return response.data;
};

const clearCart = async () => {
    const response = await cartApi.clearCart();
    return response.data;
};

const cartService = {
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
};

export default cartService;