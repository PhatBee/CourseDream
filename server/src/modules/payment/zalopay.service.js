import axios from 'axios';
import CryptoJS from 'crypto-js';
import moment from 'moment';

const config = {
    app_id: process.env.ZALOPAY_APP_ID,
    key1: process.env.ZALOPAY_KEY1,
    key2: process.env.ZALOPAY_KEY2,
    endpoint: process.env.ZALOPAY_ENDPOINT,
    query_endpoint: process.env.ZALOPAY_QUERY_ENDPOINT,
    return_url: process.env.ZALOPAY_RETURN
};

/**
 * Tạo URL thanh toán ZaloPay
 */
export const createPaymentUrl = async (data) => {
    const { amount, orderInfo, items, bankCode } = data;

    const embed_data = {
        // Quan trọng: Redirect về frontend kèm theo mã giao dịch để query
        redirecturl: `${config.return_url}?app_trans_id=${data.app_trans_id}`
    };

    const order = {
        app_id: config.app_id,
        app_trans_id: data.app_trans_id, // Format: YYMMDD_xxxx
        app_user: "user123",
        app_time: Date.now(), // miliseconds
        item: JSON.stringify(items || []),
        embed_data: JSON.stringify(embed_data),
        amount: amount,
        description: orderInfo,
        bank_code: bankCode || "",
        callback_url: "" // Sandbox local không dùng callback
    };

    // Tạo chữ ký: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
    const dataString = `${config.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
    order.mac = CryptoJS.HmacSHA256(dataString, config.key1).toString();

    try {
        const result = await axios.post(config.endpoint, null, { params: order });
        return result.data; // { return_code, order_url, ... }
    } catch (error) {
        console.error("ZaloPay Create Order Error:", error.message);
        throw new Error("Lỗi khi tạo đơn hàng ZaloPay");
    }
};

/**
 * Truy vấn trạng thái đơn hàng ZaloPay
 * (Dùng để xác thực khi user quay lại trang PaymentReturn)
 */
export const queryOrderStatus = async (app_trans_id) => {
    const postData = {
        app_id: config.app_id,
        app_trans_id: app_trans_id,
    };

    // Tạo chữ ký: app_id|app_trans_id|key1
    const dataString = `${config.app_id}|${postData.app_trans_id}|${config.key1}`;
    postData.mac = CryptoJS.HmacSHA256(dataString, config.key1).toString();

    try {
        const result = await axios.post(config.query_endpoint, null, { params: postData });
        // return_code = 1 là thành công
        return {
            isSuccess: result.data.return_code === 1,
            message: result.data.return_message,
            amount: result.data.amount
        };
    } catch (error) {
        console.error("ZaloPay Query Error:", error.message);
        return { isSuccess: false, message: "Lỗi kết nối ZaloPay" };
    }
};