# DreamCourse — Nền Tảng Học Trực Tuyến Đa Nền Tảng

DreamCourse là một hệ thống học trực tuyến full-stack, được xây dựng trên kiến trúc Monorepo với ba ứng dụng độc lập: một REST API backend, một web SPA (Single Page Application) và một ứng dụng mobile đa nền tảng. Hệ thống giải quyết bài toán kết nối người dạy và người học thông qua một nền tảng thống nhất, hỗ trợ quản lý khóa học theo dạng video, tương tác thời gian thực, và tích hợp thanh toán nội địa.

---

## Mục Lục

1. [Tech Stack](#tech-stack)
2. [Kiến Trúc & Cấu Trúc Thư Mục](#kiến-trúc--cấu-trúc-thư-mục)
3. [Tính Năng Cốt Lõi](#tính-năng-cốt-lõi)
4. [Bắt Đầu (Getting Started)](#bắt-đầu-getting-started)
5. [Biến Môi Trường](#biến-môi-trường)
6. [Các Lệnh Thực Thi](#các-lệnh-thực-thi)
7. [Nhóm Phát Triển & Giấy Phép](#nhóm-phát-triển--giấy-phép)

---

## Tech Stack

### 🖥️ Backend (`/server`)

| Công Nghệ | Vai Trò |
|---|---|
| Node.js `>= 18.x` + Express.js `v5` | HTTP server, REST API |
| MongoDB + Mongoose | Cơ sở dữ liệu chính (ODM) |
| Socket.IO | Real-time notifications & thảo luận |
| JSON Web Token (JWT) | Xác thực & phân quyền (Access/Refresh token) |
| bcrypt / bcryptjs | Hash mật khẩu |
| Nodemailer (SMTP Gmail) | Gửi email xác thực tài khoản |
| Cloudinary | Lưu trữ ảnh và media |
| AWS S3 + CloudFront | Lưu trữ video (public & private), CDN phân phối nội dung |
| CloudFront Signed URLs | Bảo vệ nội dung video trả phí |
| Google Gemini API (`@google/generative-ai`) | Chatbot AI hỗ trợ học viên |
| Google OAuth 2.0 / Facebook OAuth | Đăng nhập xã hội |
| VNPay / MoMo / ZaloPay | Cổng thanh toán nội địa (Sandbox) |
| node-cron | Lên lịch tác vụ nền (ví dụ: tự động hết hạn khuyến mãi) |
| express-validator | Kiểm tra & làm sạch dữ liệu đầu vào |
| Multer | Xử lý upload file |
| ngrok | Expose localhost cho payment gateway callback (môi trường dev) |

### 🌐 Frontend Web (`/client`)

| Công Nghệ | Vai Trò |
|---|---|
| React.js `v19` | UI framework |
| Vite | Build tool & development server |
| Redux Toolkit `v2` | Quản lý state toàn cục |
| React Router DOM | Client-side routing |
| Axios | HTTP client |
| Socket.IO Client | Nhận thông báo real-time |
| TailwindCSS `v4` | Styling framework |
| ApexCharts / react-apexcharts | Biểu đồ thống kê (Dashboard) |
| @dnd-kit | Drag-and-drop (sắp xếp bài học) |
| @react-oauth/google | Nút đăng nhập Google |
| @greatsumini/react-facebook-login | Nút đăng nhập Facebook |
| react-hot-toast | Toast notification |
| react-markdown | Render nội dung Markdown |
| Feather / Font Awesome / Tabler Icons | Bộ icon |
| Select2 / Slick | Plugin UI (select nâng cao, carousel) |

### 📱 Mobile App (`/course-app`)

| Công Nghệ | Vai Trò |
|---|---|
| Expo `~54` (React Native) | Framework cross-platform mobile |
| React Navigation (Stack, Tab, Native) | Điều hướng trong ứng dụng |
| Redux Toolkit `v2` | Quản lý state toàn cục |
| Axios | HTTP client |
| expo-video / expo-av | Phát video bài học |
| expo-auth-session | OAuth trong môi trường Expo |
| expo-image-picker | Chọn ảnh đại diện |
| expo-secure-store | Lưu token bảo mật trên thiết bị |
| expo-linear-gradient | Hiệu ứng gradient UI |
| expo-screen-orientation | Xoay màn hình khi xem video |
| Android Native Build | Tích hợp native project cho bản build sản xuất |

---

## Kiến Trúc & Cấu Trúc Thư Mục

Dự án theo mô hình **Monorepo**: ba package được quản lý chung trong một repository, dùng chung một REST API backend.

```
Dream/
├── server/       # Node.js/Express REST API + WebSocket server
├── client/       # React.js SPA (web application)
└── course-app/   # Expo (React Native) mobile application
```

### `/server` — Backend API

```
server/
├── src/
│   ├── config/          # Kết nối database, khởi tạo biến môi trường
│   ├── cron/            # Các tác vụ nền (cron jobs): tự động hết hạn mã giảm giá, v.v.
│   ├── middlewares/     # Auth guard, xử lý lỗi, upload handler (Multer)
│   ├── modules/         # Tập hợp các module nghiệp vụ (route → controller → service → model)
│   │   ├── auth/        # Đăng ký, đăng nhập, Google/Facebook OAuth, refresh token
│   │   ├── user/        # Quản lý hồ sơ người dùng
│   │   ├── course/      # CRUD khóa học, chương (section), bài học (lesson)
│   │   ├── video/       # Upload video lên S3, tạo CloudFront Signed URL
│   │   ├── quiz/        # Bài kiểm tra nội khóa
│   │   ├── enrollment/  # Logic ghi danh khóa học
│   │   ├── progress/    # Theo dõi tiến độ học viên theo từng bài
│   │   ├── payment/     # Tích hợp VNPay, MoMo, ZaloPay; xử lý callback
│   │   ├── cart/        # Giỏ hàng
│   │   ├── promotion/   # Mã giảm giá & chương trình khuyến mãi
│   │   ├── review/      # Đánh giá & nhận xét khóa học
│   │   ├── discussion/  # Thảo luận hỏi đáp trong khóa học
│   │   ├── notification/# Thông báo trong ứng dụng
│   │   ├── report/      # Hệ thống báo cáo vi phạm nội dung
│   │   ├── wishlist/    # Danh sách yêu thích
│   │   ├── instructor/  # Dữ liệu & phân tích dành riêng cho giảng viên
│   │   ├── category/    # Quản lý danh mục khóa học
│   │   ├── chatbot/     # Chatbot AI tích hợp Google Gemini
│   │   ├── admin/       # Bảng điều khiển & kiểm duyệt (Admin)
│   │   └── socket/      # Xử lý các sự kiện Socket.IO
│   └── utils/           # Các hàm tiện ích dùng chung
├── docs/                # Tài liệu API
├── plantUML/            # Sơ đồ kiến trúc & ERD (PlantUML)
├── scripts/             # Script seed dữ liệu & tiện ích
└── tmp/uploads/         # Lưu file tạm thời khi upload (đã gitignore)
```

### `/client` — Web Application (SPA)

```
client/
└── src/
    ├── api/             # Cấu hình Axios instance & định nghĩa endpoint
    ├── app/             # Khởi tạo Redux store
    ├── assets/          # CSS, hình ảnh, icon, plugin (font-awesome, select2, slick)
    ├── components/      # Component UI tái sử dụng (common, course, admin, instructor)
    ├── features/        # Redux slice theo domain (auth, course, payment, cart, ...)
    ├── hooks/           # Custom React hooks
    ├── layouts/         # Wrapper bố cục trang
    ├── pages/           # Component cấp trang theo route (admin, instructor)
    ├── routes/          # Định nghĩa route & Protected Route guard
    └── utils/           # Hàm tiện ích & hằng số
```

### `/course-app` — Mobile Application

```
course-app/
├── src/
│   ├── api/             # Cấu hình Axios instance & định nghĩa endpoint
│   ├── app/             # Khởi tạo Redux store
│   ├── components/      # Component UI mobile (common, course, home, learning)
│   ├── constants/       # Hằng số ứng dụng (API base URL, màu sắc, v.v.)
│   ├── features/        # Redux slice theo domain (tương đồng với web)
│   ├── navigation/      # Cấu hình Stack & Tab Navigator
│   ├── screens/         # Màn hình theo từng tính năng (auth, course, payment, ...)
│   ├── store/           # Cấu hình Redux store
│   └── utils/           # Hàm tiện ích & hằng số
└── android/             # Native Android project (dùng cho bản build production)
```

---

## Tính Năng Cốt Lõi

### 👤 Xác Thực & Phân Quyền

- Đăng ký bằng email, xác thực tài khoản qua email SMTP
- Đăng nhập xã hội: Google OAuth 2.0, Facebook OAuth
- Luồng JWT với Access Token (ngắn hạn) và Refresh Token (dài hạn)
- Phân quyền 3 vai trò: `student` (học viên), `instructor` (giảng viên), `admin` (quản trị viên)

### 📚 Quản Lý Khóa Học

- Giảng viên tạo, chỉnh sửa, xuất bản khóa học với cấu trúc chương (section) và bài học (lesson)
- Upload video bài học lên AWS S3; phân phối thông qua CloudFront với Signed URL (bảo vệ nội dung)
- Bài kiểm tra (quiz) tích hợp trong khóa học
- Quản lý danh mục & gắn thẻ khóa học
- Sắp xếp thứ tự bài học bằng Drag-and-Drop (web)

### 🎓 Trải Nghiệm Học Tập

- Theo dõi tiến độ học từng bài; tự động tiếp tục từ vị trí đã dừng
- Xoay màn hình khi xem video (mobile)
- Diễn đàn thảo luận hỏi đáp (Q&A) trong từng khóa học
- Chatbot AI hỗ trợ học viên, được cung cấp bởi Google Gemini

### 💳 Thanh Toán

- Giỏ hàng và luồng thanh toán đầy đủ
- Tích hợp ba cổng thanh toán nội địa: **VNPay**, **MoMo**, **ZaloPay**
- Hỗ trợ mã giảm giá và chương trình khuyến mãi
- Callback từ cổng thanh toán được xử lý phía server; redirect về web (`WEB_RETURN_URL`) hoặc deep link mobile (`MOBILE_RETURN_URL`) sau khi hoàn tất

### ⭐ Cộng Đồng & Tương Tác

- Đánh giá và viết nhận xét khóa học
- Hệ thống báo cáo vi phạm nội dung
- Danh sách yêu thích (wishlist)
- Thông báo trong ứng dụng thời gian thực qua Socket.IO

### 🛠️ Dashboard Quản Trị & Giảng Viên

- Admin: Quản lý người dùng, kiểm duyệt nội dung, thống kê nền tảng (biểu đồ ApexCharts)
- Giảng viên: Theo dõi hiệu suất khóa học, doanh thu
- Tác vụ nền tự động (cron): tự động hết hạn khuyến mãi, v.v.

---

## Bắt Đầu (Getting Started)

### Điều Kiện Cần Có (Prerequisites)

| Công Cụ | Phiên Bản Khuyến Nghị |
|---|---|
| Node.js | `>= 18.x` |
| npm | `>= 9.x` |
| Git | Bất kỳ phiên bản ổn định |
| MongoDB Atlas | Cluster cloud (hoặc `mongod >= 6.0` local) |
| Expo CLI | `npm install -g expo-cli` |
| Android Studio | Để chạy Android Emulator (tùy chọn) |
| ngrok | Để expose localhost cho payment gateway callback khi dev local |

---

### Cài Đặt

#### 1. Clone repository

```bash
git clone https://github.com/YOUR_USERNAME/dreamcourse.git
cd dreamcourse
```

#### 2. Backend (`/server`)

```bash
cd server
npm install
```

Sao chép file cấu hình môi trường và điền các giá trị thực tế:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Khởi động server phát triển (hot-reload):

```bash
npm run dev
```

> API sẽ chạy tại: `http://localhost:5000`

---

#### 3. Frontend Web (`/client`)

```bash
cd client
npm install
```

Tạo file `.env` trong thư mục `/client`:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

Khởi động development server:

```bash
npm run dev
```

> Web app sẽ chạy tại: `http://localhost:5173`

> **Lưu ý:** Backend phải được khởi động trước khi chạy frontend.

---

#### 4. Mobile App (`/course-app`)

```bash
cd course-app
npm install
npx expo start
```

- Nhấn `a` để mở Android Emulator.
- Nhấn `i` để mở iOS Simulator (chỉ hỗ trợ trên macOS).
- Quét mã QR bằng ứng dụng **Expo Go** trên thiết bị thật.

> **Lưu ý:** Khi chạy trên thiết bị vật lý, cập nhật hằng số base URL trong `course-app/src/constants/` thành địa chỉ IP của máy host (ví dụ: `http://192.168.x.x:5000`) để thiết bị có thể kết nối đến backend.

---

## Biến Môi Trường

Tạo file `.env` trong thư mục `/server`. Template đầy đủ:

```env
# -- Server -------------------------------------------------------
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# -- Xác Thực (JWT) -----------------------------------------------
JWT_SECRET=your_jwt_access_token_secret
JWT_REFRESH_SECRET=your_jwt_refresh_token_secret

# -- AI Chatbot ---------------------------------------------------
GEMINI_API_KEY=your_google_gemini_api_key

# -- Email (SMTP) -------------------------------------------------
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# -- Google OAuth 2.0 ---------------------------------------------
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_ID_YOUTUBE=your_google_youtube_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT=http://localhost:5000/api/youtube/oauth2callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token

# -- Facebook OAuth -----------------------------------------------
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# -- Cloudinary (Lưu trữ ảnh) -------------------------------------
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# -- AWS S3 & CloudFront (Video Storage & CDN) --------------------
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET_NAME=your-public-video-bucket
AWS_S3_BUCKET_NAME_PRIVATE=your-private-video-bucket
CLOUDFRONT_DOMAIN=your_public_cloudfront_domain
CLOUDFRONT_DISTRIBUTION_ID=your_public_distribution_id
CLOUDFRONT_DOMAIN_PRIVATE=your_private_cloudfront_domain
CLOUDFRONT_DISTRIBUTION_ID_PRIVATE=your_private_distribution_id
CLOUDFRONT_KEY_PAIR_ID=your_cloudfront_key_pair_id
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...your RSA private key content...
-----END RSA PRIVATE KEY-----"

# -- VNPay --------------------------------------------------------
VNPAY_TMNCODE=your_vnpay_tmn_code
VNPAY_HASHSECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNPAY_RETURN_URL=https://your-ngrok-subdomain.ngrok-free.app/api/payments/vnpay_return

# -- MoMo ---------------------------------------------------------
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=https://your-ngrok-subdomain.ngrok-free.app/api/payments/momo_return

# -- ZaloPay ------------------------------------------------------
ZALOPAY_APP_ID=your_zalopay_app_id
ZALOPAY_KEY1=your_zalopay_key1
ZALOPAY_KEY2=your_zalopay_key2
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_QUERY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/query
ZALOPAY_RETURN_URL=https://your-ngrok-subdomain.ngrok-free.app/api/payments/zalopay_return

# -- URL Redirect Sau Thanh Toán ----------------------------------
# Web frontend (backend redirect trình duyệt về đây)
WEB_RETURN_URL=http://localhost:5173/payment/return

# Deep link mobile (phải khớp với scheme trong app.json)
MOBILE_RETURN_URL=courseapp://payment/result

# -- Tunneling (cho payment gateway callback khi dev local) -------
NGROK_FORWARD=https://your-ngrok-subdomain.ngrok-free.app
```

> **Payment Webhook:** Cổng thanh toán yêu cầu URL callback phải công khai. Khi dev local, dùng [ngrok](https://ngrok.com/) (`ngrok http 5000`), sau đó cập nhật `NGROK_FORWARD` và các `*_RETURN_URL` với URL ngrok được cấp.

> **Gmail App Password:** Bật xác minh 2 bước trên tài khoản Google, sau đó tạo [App Password](https://myaccount.google.com/apppasswords) để dùng cho `EMAIL_PASS` (không dùng mật khẩu Gmail thông thường).

---

## Các Lệnh Thực Thi

### Backend (`/server`)

| Lệnh | Mô Tả |
|---|---|
| `npm run dev` | Khởi động server với hot-reload (nodemon) |
| `npm start` | Khởi động server ở chế độ production |
| `npm run seed` | Seed dữ liệu khởi tạo vào database |

### Frontend Web (`/client`)

| Lệnh | Mô Tả |
|---|---|
| `npm run dev` | Khởi động Vite development server |
| `npm run build` | Build production bundle ra thư mục `/dist` |
| `npm run preview` | Xem trước bản build production ở local |
| `npm run lint` | Chạy ESLint kiểm tra code |

### Mobile App (`/course-app`)

| Lệnh | Mô Tả |
|---|---|
| `npm start` | Khởi động Expo development server |
| `npm run android` | Build & chạy trên Android device/emulator |
| `npm run ios` | Build & chạy trên iOS Simulator (macOS only) |
| `npm run web` | Chạy ứng dụng trên trình duyệt (Expo web mode) |

---

## Nhóm Phát Triển & Giấy Phép

### 👥 Nhóm Phát Triển

Dự án được thực hiện bởi **Nhóm 59** trong khuôn khổ Tiểu Luận Chuyên Ngành:

| Họ & Tên | Vai Trò |
|---|---|
| Ông Vĩnh Phát | Full-Stack Developer (Backend, Frontend Web) |
| Phạm Đăng Khôi | Full-Stack Developer (Mobile App, Frontend Web) |
| Huỳnh Thị Mỹ Tâm | Full-Stack Developer (Frontend Web, Testing & QA) |

Đóng góp, báo lỗi hoặc yêu cầu tính năng mới: vui lòng mở một Issue hoặc gửi Pull Request.

---

### 📄 Giấy Phép

Dự án này được phát triển cho mục đích học thuật — Tiểu Luận Chuyên Ngành.  
Bản quyền © 2025 **DreamCourse — Nhóm 59**. Toàn quyền bảo lưu.
