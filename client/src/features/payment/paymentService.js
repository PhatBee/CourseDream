import paymentApi from "../../api/paymentApi";

// Tạo giao dịch VNPAY
const createVNPayPayment = async (data) => {
    const response = await paymentApi.createVNPayPayment(data);
    return response.data; // Trả về { paymentUrl: '...' }
};

// Xác thực kết quả thanh toán
const verifyPayment = async (searchParams) => {
    // Logic xác định là VNPAY hay MOMO dựa trên tham số URL
    // VNPAY luôn có 'vnp_SecureHash', MoMo có 'signature'
    const params = new URLSearchParams(searchParams);

    if (params.has('vnp_SecureHash')) {
        const response = await paymentApi.vnpayReturn(searchParams);
        return response.data;
    } else if (params.has('signature')) {
        const response = await paymentApi.momoReturn(searchParams); // Gọi hàm mới
        return response.data;
    } else {
        throw new Error("Cổng thanh toán không xác định");
    }
};

const createMomoPayment = async (data) => {
    const response = await paymentApi.createMomoPayment(data);
    return response.data;
};

const paymentService = {
    createVNPayPayment,
    createMomoPayment,
    verifyPayment
};

export default paymentService;