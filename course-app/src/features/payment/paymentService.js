import axiosClient from "../../api/axiosClient";

const path = '/payments';

// createVNPayPayment: (data) => {
//         return axiosClient.post(`${path}/create_payment_url`, data);
//     },

//     // Gửi thông tin từ URL Return về Backend để xác thực
//     vnpayReturn: (params) => {
//         // params là query string từ URL (VD: ?vnp_Amount=...&vnp_ResponseCode=...)
//         return axiosClient.get(`${path}/vnpay_return${params}`);
//     },

//     createMomoPayment: (data) => {
//         return axiosClient.post(`${path}/create_momo_url`, data);
//     },
//     momoReturn: (params) => {
//         return axiosClient.get(`${path}/momo_return${params}`);
//     },
//     createZaloPayPayment: (data) => {
//         return axiosClient.post(`${path}/create_zalopay_url`, data);
//     },
//     zalopayReturn: (params) => {
//         // params ở đây sẽ chứa ?app_trans_id=...
//         return axiosClient.get(`${path}/zalopay_return${params}`);
//     },
//     // Hàm mới cho 0 đồng
//     createFreeEnrollment: (data) => {
//         return axiosClient.post(`${path}/create_free_enrollment`, data);
//     }

const createVNPayPayment = async (data) => {
    const response = await axiosClient.post(`${path}/create_payment_url`, data);
    return response.data;
};

const createMomoPayment = async (data) => {
    const response = await axiosClient.post(`${path}/create_momo_url`, data);
    return response.data;
};

const createZaloPayPayment = async (data) => {
    const response = await axiosClient.post(`${path}/create_zalopay_url`, data);
    return response.data;
};

const createFreeEnrollment = async (data) => {
    const response = await axiosClient.post(`${path}/create_free_enrollment`, data);
    return response.data;
};

const vnpayReturn = async (params) => {
    const response = await axiosClient.get(`${path}/vnpay_return${params}`);
    return response.data;
};

const momoReturn = async (params) => {
    const response = await axiosClient.get(`${path}/momo_return${params}`);
    return response.data;
};

const zalopayReturn = async (params) => {
    const response = await axiosClient.get(`${path}/zalopay_return${params}`);
    return response.data;
};

const paymentService = {
    createVNPayPayment,
    createMomoPayment,
    createZaloPayPayment,
    createFreeEnrollment,
    vnpayReturn,
    momoReturn,
    zalopayReturn
};

export default paymentService;
