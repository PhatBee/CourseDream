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
    }
};

export default paymentApi;