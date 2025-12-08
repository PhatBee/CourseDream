## COURSE DREAM

## ⚙️ Cài đặt và chạy dự án

### ✅ Yêu cầu

* Node.js >= 16
* MongoDB (local hoặc Atlas)
* Git

### Cài đặt

```bash
# Clone source
$ git clone https://github.com/PhatBee/coursedream.git
$ cd coursedream

# Server 
cd server  
npm install express mongoose dotenv cors jsonwebtoken bcrypt bcryptjs cookie-parser morgan express-validator nodemailer google-auth-library axios cloudinary multer-storage-cloudinary multer streamifier node-cron socket.io crypto-js slugify googleapis
npm install tailwindcss @tailwindcss/vite
npm install --save-dev nodemon

# Client
cd client
npm install axios react-router-dom redux @reduxjs/toolkit react-hot-toast react-toastify @react-oauth/google
npm install react-facebook-login -S --force
npm install recharts --force
npm i lucide-react --force
npm install react-icons --force

# app
cd course-app
npm install
```

### Cấu hình môi trường
```bash
# env trong server
PORT=5000
MONGO_URI=YOUR_MONGO_URI
JWT_SECRET=YOUR_JWT_SECRET

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=YOUR_EMAIL@gmail.com
EMAIL_PASS=YOUR_EMAIL_PASS

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_ID_YOUTUBE=YOUR_GOOGLE_CLIENT_ID_YOUTUBE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT=http://localhost:5000/api/youtube/oauth2callback
GOOGLE_REFRESH_TOKEN=YOUR_GOOGLE_REFRESH_TOKEN

FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID
FACEBOOK_APP_SECRET=YOUR_FACEBOOK_APP_SECRET

CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET
CLOUDINARY_NAME=YOUR_CLOUDINARY_NAME

VNPAY_TMNCODE=YOUR_VNPAY_TMNCODE
VNPAY_HASHSECRET=YOUR_VNPAY_HASHSECRET
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNPAY_RETURN_URL=http://localhost:5173/payment/return

MOMO_PARTNER_CODE=YOUR_MOMO_PARTNER_CODE
MOMO_ACCESS_KEY=YOUR_MOMO_ACCESS_KEY
MOMO_SECRET_KEY=YOUR_MOMO_SECRET_KEY
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:5173/payment/return

ZALOPAY_APP_ID=YOUR_ZALOPAY_APP_ID
ZALOPAY_KEY1=YOUR_ZALOPAY_KEY1
ZALOPAY_KEY2=YOUR_ZALOPAY_KEY2
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_QUERY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/query
ZALOPAY_RETURN=http://localhost:5173/payment/return

# env trong client
VITE_API_URL="http://localhost:5000/api"
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID