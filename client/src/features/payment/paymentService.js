import paymentApi from "../../api/paymentApi";

// Tạo giao dịch VNPAY
const createVNPayPayment = async (data) => {
    const response = await paymentApi.createVNPayPayment(data);
    return response.data; // Trả về { paymentUrl: '...' }
};

// Xác thực kết quả thanh toán
const verifyPayment = async (searchParams) => {
    const response = await paymentApi.vnpayReturn(searchParams);
    return response.data;
};

const paymentService = {
    createVNPayPayment,
    verifyPayment
};

export default paymentService;