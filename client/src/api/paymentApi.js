import axiosClient from "./axiosClient";

const path = "/payments";

const paymentApi = {
    // Tạo URL thanh toán VNPAY
    createVNPayPayment: (data) => {
        return axiosClient.post(`${path}/create_payment_url`, data);
    },

    // Gửi thông tin từ URL Return về Backend để xác thực
    vnpayReturn: (params) => {
        // params là query string từ URL (VD: ?vnp_Amount=...&vnp_ResponseCode=...)
        return axiosClient.get(`${path}/vnpay_return${params}`);
    },

    createMomoPayment: (data) => {
        return axiosClient.post(`${path}/create_momo_url`, data);
    },
    momoReturn: (params) => {
        return axiosClient.get(`${path}/momo_return${params}`);
    },
    createZaloPayPayment: (data) => {
        return axiosClient.post(`${path}/create_zalopay_url`, data);
    },
    zalopayReturn: (params) => {
        // params ở đây sẽ chứa ?app_trans_id=...
        return axiosClient.get(`${path}/zalopay_return${params}`);
    },
    // Hàm mới cho 0 đồng
    createFreeEnrollment: (data) => {
        return axiosClient.post(`${path}/create_free_enrollment`, data);
    }
};

export default paymentApi;