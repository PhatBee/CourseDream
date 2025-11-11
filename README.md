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
npm install express mongoose dotenv cors jsonwebtoken bcrypt bcryptjs cookie-parser morgan express-validator nodemailer google-auth-library
npm install tailwindcss @tailwindcss/vite
npm install --save-dev nodemon

# Client
cd client
npm install axios react-router-dom redux @reduxjs/toolkit react-hot-toast react-toastify
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
# env trong client