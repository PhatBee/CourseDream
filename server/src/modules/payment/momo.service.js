import crypto from 'crypto';
import axios from 'axios';

/**
 * Tạo URL thanh toán MoMo
 */
export const createPaymentUrl = async (data) => {
    const { amount, orderId, orderInfo, ipAddr, lang = 'vi' } = data;

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const redirectUrl = process.env.MOMO_RETURN_URL; // Backend return URL
    const ipnUrl = process.env.MOMO_IPN_URL || redirectUrl; // Sandbox không có IPN
    const requestType = "payWithMethod";
    const extraData = ""; // Pass empty string if not used
    const requestId = orderId;
    const orderGroupId = "";
    const autoCapture = true;

    // Tạo chuỗi thô để ký (Thứ tự tham số rất quan trọng)
    // accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    // Tạo chữ ký HMAC SHA256
    const signature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    // Tạo request body
    const requestBody = {
        partnerCode,
        partnerName: "DreamsLMS",
        storeId: "MomoTestStore",
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang,
        requestType,
        autoCapture,
        extraData,
        orderGroupId,
        signature
    };

    // Gọi API tạo thanh toán của MoMo
    // Lưu ý: Đây là URL Sandbox
    const momoEndpoint = process.env.MOMO_ENDPOINT;

    try {
        const response = await axios.post(momoEndpoint, requestBody, {
            headers: { 'Content-Type': 'application/json' }
        });

        return response.data; // Trả về object chứa payUrl
    } catch (error) {
        console.error("MoMo Create Payment Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Lỗi khi tạo giao dịch MoMo");
    }
};

/**
 * Xác thực dữ liệu trả về từ MoMo (Return URL)
 */
export const verifyReturnUrl = (momoParams) => {
    const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature: receivedSignature
    } = momoParams;

    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;

    // Tạo lại chữ ký để so sánh
    // accessKey=$accessKey&amount=$amount&extraData=$extraData&message=$message&orderId=$orderId&orderInfo=$orderInfo&orderType=$orderType&partnerCode=$partnerCode&payType=$payType&requestId=$requestId&responseTime=$responseTime&resultCode=$resultCode&transId=$transId
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const generatedSignature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    if (generatedSignature === receivedSignature) {
        // resultCode = 0 là thành công
        return { isSuccess: resultCode == '0', message };
    } else {
        return { isSuccess: false, message: 'Invalid Signature' };
    }
};