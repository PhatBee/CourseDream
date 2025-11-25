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
npm install express mongoose dotenv cors jsonwebtoken bcrypt bcryptjs cookie-parser morgan express-validator nodemailer google-auth-library axios cloudinary multer-storage-cloudinary multer streamifier node-cron
npm install tailwindcss @tailwindcss/vite
npm install --save-dev nodemon

# Client
cd client
npm install axios react-router-dom redux @reduxjs/toolkit react-hot-toast react-toastify @react-oauth/google
npm install react-facebook-login -S --force
npm i lucide-react --force
npm install react-icons --force
```

### Cấu hình môi trường
```bash
# env trong server
PORT=5000
MONGO_URI=
JWT_SECRET=

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=YOUR_EMAIL@gmail.com
EMAIL_PASS=

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com

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

# env trong client
VITE_API_URL="http://localhost:5000/api"
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID