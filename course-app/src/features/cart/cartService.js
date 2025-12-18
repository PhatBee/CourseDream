import cartApi from '../../api/cartApi';

const getCart = async () => {
  const res = await cartApi.getCart();
  return res.data.data; // backend trả về { success, data }
};

const addToCart = async (courseId) => {
  const res = await cartApi.addToCart(courseId);
  return res.data.data;
};

const removeFromCart = async (courseId) => {
  const res = await cartApi.removeFromCart(courseId);
  return res.data.data;
};

const clearCart = async () => {
  const res = await cartApi.clearCart();
  return res.data.data;
};

const cartService = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
};

export default cartService;