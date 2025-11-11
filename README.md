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
cd client && npm install 
cd server  
npm install express mongoose dotenv cors jsonwebtoken bcrypt bcryptjs cookie-parser morgan express-validator nodemailer
npm install tailwindcss @tailwindcss/vite
npm install --save-dev nodemon

# Client
cd client
npm install axios react-router-dom redux @reduxjs/toolkit react-hot-toast react-toastify
```