import moment from 'moment';
import qs from 'qs';
import crypto from 'crypto';

/**
 * Hàm sắp xếp object theo thứ tự bảng chữ cái (Bắt buộc của VNPAY)
 */
function sortObject(obj) {
    let sorted = {};
    let keys = [];

    for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            keys.push(encodeURIComponent(key));
        }
    }

    keys.sort();

    keys.forEach((key) => {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    });

    return sorted;
}

/**
 * Tạo URL thanh toán
 */
export const createPaymentUrl = async (data) => {
    const { amount, orderId, orderInfo, ipAddr, bankCode, language = 'vn' } = data;

    const tmnCode = process.env.VNPAY_TMNCODE;
    const secretKey = process.env.VNPAY_HASHSECRET;
    const vnpUrl = process.env.VNPAY_URL;
    // URL Frontend nhận kết quả quay về
    const returnUrl = process.env.VNPAY_RETURN_URL;

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = language;
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // VNPAY tính đơn vị đồng (nhân 100)
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    if (bankCode) {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    // Sắp xếp tham số
    vnp_Params = sortObject(vnp_Params);

    // Ký dữ liệu
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    vnp_Params['vnp_SecureHash'] = signed;

    // Tạo URL cuối cùng
    const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });
    return paymentUrl;
};

/**
 * Xác thực dữ liệu trả về (Return URL)
 */
export const verifyReturnUrl = (vnp_Params) => {
    // Convert về plain object nhằm tránh lỗi hasOwnProperty
    vnp_Params = JSON.parse(JSON.stringify(vnp_Params));

    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const secretKey = process.env.VNPAY_HASHSECRET;
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
        // 00 là mã thành công của VNPAY
        return { isSuccess: vnp_Params['vnp_ResponseCode'] === '00' };
    } else {
        return { isSuccess: false, message: 'Invalid Signature' };
    }
};