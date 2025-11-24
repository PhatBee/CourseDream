import axiosClient from "./axiosClient";

const path = "/cart";

const getCart = () => {
    return axiosClient.get(path);
};

const addToCart = (data) => {
    // data: { courseId: "..." }
    return axiosClient.post(`${path}/add`, data);
};

const removeFromCart = (courseId) => {
    return axiosClient.delete(`${path}/remove/${courseId}`);
};

const clearCart = () => {
    return axiosClient.delete(`${path}/clear`);
};

export default {
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
};