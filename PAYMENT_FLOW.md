# Luồng Thanh Toán Đã Cải Thiện (Payment Flow v2)

## Tổng Quan

Luồng thanh toán đã được cải thiện để hoạt động tốt hơn trong môi trường sandbox (không có IPN). Backend sẽ xử lý kết quả thanh toán và redirect về client với thông tin đầy đủ.

## 7 Bước Thanh Toán

### Bước 1: CLIENT GỌI API TẠO PAYMENT (REST API)
- **Web**: `client/src/pages/Checkout.jsx`
- **Mobile**: `course-app/src/screens/cart/CheckoutScreen.js`
- Client gọi API với `platform: 'web'` hoặc `platform: 'mobile'`
- API endpoints:
  - VNPAY: `POST /api/payment/create_payment_url`
  - MoMo: `POST /api/payment/create_momo_url`
  - ZaloPay: `POST /api/payment/create_zalopay_url`

### Bước 2: BACKEND TẠO URL THANH TOÁN
- **Backend**: `server/src/modules/payment/payment.controller.js`
- **Services**: 
  - `vnpay.service.js`
  - `momo.service.js`
  - `zalopay.service.js`
- Backend tạo payment record trong DB với `platform`
- Tạo URL thanh toán với `returnUrl` trỏ về backend:
  - VNPAY: `VNPAY_RETURN_URL`
  - MoMo: `MOMO_RETURN_URL`
  - ZaloPay: `ZALOPAY_RETURN_URL`

### Bước 3: CLIENT MỞ LINK THANH TOÁN
- **Web**: Redirect toàn trang (`window.location.href`)
- **Mobile**: Mở trong WebView (`PaymentWebViewScreen.js`)

### Bước 4: USER THANH TOÁN / HỦY
- User thực hiện thanh toán trên cổng thanh toán
- Hoặc hủy giao dịch

### Bước 5: BACKEND NHẬN RETURN (KHÔNG PHẢI API)
- **Routes**: `server/src/modules/payment/payment.routes.js`
  - `GET /api/payment/vnpay_return`
  - `GET /api/payment/momo_return`
  - `GET /api/payment/zalopay_return`
- **Controller**: `payment.controller.js`
  - Xác thực chữ ký từ payment gateway
  - Cập nhật payment status trong DB
  - Enroll student vào courses
  - Xóa courses khỏi giỏ hàng

### Bước 6: BACKEND REDIRECT VỀ CLIENT
- Backend sử dụng `res.redirect()` với query params:
  ```javascript
  const redirectUrl = buildRedirectUrl(platform, {
      success: 'true',
      message: 'Thanh toán thành công',
      method: 'vnpay',
      orderId: orderId,
      amount: payment.amount
  });
  return res.redirect(redirectUrl);
  ```
- Redirect URL dựa trên platform:
  - Web: `WEB_RETURN_URL`
  - Mobile: `MOBILE_RETURN_URL`

### Bước 7: CLIENT NHẬN KẾT QUẢ
- **Web**: `client/src/pages/PaymentReturn.jsx`
  - Parse URL params trực tiếp
  - Hiển thị kết quả
  - Cập nhật giỏ hàng
  
- **Mobile**: 
  - `PaymentWebViewScreen.js`: Detect redirect URL
  - `PaymentResultScreen.js`: Parse params và hiển thị

## Cấu Trúc Files

### Backend
```
server/src/modules/payment/
├── payment.controller.js    # Return handlers với redirect
├── payment.routes.js        # GET routes cho return URLs
├── payment.service.js       # DB operations
├── payment.model.js         # Payment schema với platform field
├── vnpay.service.js         # VNPAY integration
├── momo.service.js          # MoMo integration
└── zalopay.service.js       # ZaloPay integration
```

### Web Client
```
client/src/
├── pages/
│   ├── Checkout.jsx         # Gửi platform: 'web'
│   └── PaymentReturn.jsx    # Parse URL params
└── api/paymentApi.js
```

### Mobile Client
```
course-app/src/
├── screens/
│   ├── cart/CheckoutScreen.js              # Gửi platform: 'mobile'
│   └── payment/
│       ├── PaymentWebViewScreen.js         # Detect redirect
│       └── PaymentResultScreen.js          # Parse params
└── features/payment/paymentService.js
```

## Environment Variables

### Backend Return URLs (nhận callback từ gateway)
```env
VNPAY_RETURN_URL=http://localhost:5000/api/payment/vnpay_return
MOMO_RETURN_URL=http://localhost:5000/api/payment/momo_return
ZALOPAY_RETURN_URL=http://localhost:5000/api/payment/zalopay_return
```

### Client Return URLs (redirect từ backend)
```env
WEB_RETURN_URL=http://localhost:3000/payment-return
MOBILE_RETURN_URL=http://localhost:3000/payment-return
```

## Query Params Format

Backend redirect với params:
```
?success=true
&message=Thanh%20to%C3%A1n%20th%C3%A0nh%20c%C3%B4ng
&method=vnpay
&orderId=123456
&amount=100000
```

## Ưu Điểm

1. **Không cần IPN**: Hoạt động tốt trong sandbox
2. **Đồng bộ**: Web và mobile dùng cùng logic
3. **Đơn giản**: Client chỉ cần parse URL params
4. **An toàn**: Xác thực và xử lý ở backend
5. **Linh hoạt**: Dễ thêm payment gateway mới

## Testing Checklist

- [ ] Web - VNPAY thanh toán thành công
- [ ] Web - VNPAY thanh toán thất bại
- [ ] Web - MoMo thanh toán thành công
- [ ] Web - MoMo thanh toán thất bại
- [ ] Web - ZaloPay thanh toán thành công
- [ ] Web - ZaloPay thanh toán thất bại
- [ ] Mobile - VNPAY thanh toán thành công
- [ ] Mobile - VNPAY thanh toán thất bại
- [ ] Mobile - MoMo thanh toán thành công
- [ ] Mobile - MoMo thanh toán thất bại
- [ ] Mobile - ZaloPay thanh toán thành công
- [ ] Mobile - ZaloPay thanh toán thất bại
- [ ] Giỏ hàng được cập nhật sau thanh toán
- [ ] Enrollment được tạo sau thanh toán thành công
- [ ] Không duplicate enrollment khi refresh
