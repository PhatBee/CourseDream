# DreamsLMS Mobile App - Hướng dẫn cấu hình

## 📱 Trang Đăng nhập đã được hoàn thiện

Trang đăng nhập đã được đồng bộ với thiết kế web client sử dụng **NativeWind (Tailwind CSS)**.

## 🚀 Cài đặt và Cấu hình

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Sau đó cập nhật các giá trị trong file `.env`:

#### a. API URL
Lấy địa chỉ IP LAN của máy bạn:

**Windows:**
```bash
ipconfig
```
Tìm "IPv4 Address" (ví dụ: 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```

Cập nhật trong `.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

#### b. Google OAuth
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo hoặc chọn project
3. Vào **APIs & Services** > **Credentials**
4. Tạo **OAuth 2.0 Client ID** (loại: Web application)
5. Copy **Client ID** và paste vào `.env`:
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

#### c. Facebook OAuth
1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Tạo hoặc chọn app
3. Vào **Settings** > **Basic**
4. Copy **App ID** và paste vào `.env`:
```
EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
```

### 3. Chạy ứng dụng

```bash
npx expo start -c
```

Sau đó:
- Quét QR code bằng **Expo Go** app trên điện thoại
- Hoặc nhấn `a` để chạy trên Android Emulator
- Hoặc nhấn `i` để chạy trên iOS Simulator

## 🎨 Tính năng đã hoàn thiện

### ✅ LoginScreen
- Form đăng nhập với email và password
- Validation đầy vào
- Show/hide password
- Remember me checkbox
- Forgot password link
- Google OAuth login
- Facebook OAuth login
- Loading states
- Error handling với Alert
- Xử lý tài khoản bị ban (hiển thị lý do)
- Responsive design với NativeWind
- Navigation đến Register và ForgotPassword

### ✅ RegisterScreen
- Form đăng ký với name, email, password, confirm password
- Validation
- Responsive design

### ✅ ForgotPasswordScreen
- Form quên mật khẩu
- Responsive design

## 📂 Cấu trúc thư mục

```
course-app/
├── src/
│   ├── api/
│   │   └── axiosClient.js          # Axios instance với interceptors
│   ├── app/
│   │   └── store.js                # Redux store
│   ├── features/
│   │   └── auth/
│   │       ├── authService.js      # Auth API calls
│   │       └── authSlice.js        # Auth Redux slice
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js      # ✅ Hoàn thiện
│   │   │   ├── RegisterScreen.js   # ✅ Hoàn thiện
│   │   │   └── ForgotPasswordScreen.js # ✅ Hoàn thiện
│   │   └── home/
│   │       └── HomeScreen.jsx
│   └── utils/
│       ├── config.js               # Environment variables
│       └── storage.js              # SecureStore helpers
├── App.js                          # Main app với navigation
├── global.css                      # Tailwind CSS
├── tailwind.config.js              # Tailwind config
└── .env.example                    # Environment template
```

## 🔧 Redux State Management

### Auth State
```javascript
{
  user: null | Object,
  isLoading: boolean,
  isError: boolean,
  isSuccess: boolean,
  message: string,
  banReason: string | null
}
```

### Auth Actions
- `login({ email, password })` - Đăng nhập
- `googleLogin(credential)` - Đăng nhập Google
- `facebookLogin(accessToken)` - Đăng nhập Facebook
- `logout()` - Đăng xuất
- `reset()` - Reset state
- `setCredentials(user)` - Set user từ storage

## 🎯 Navigation Flow

```
App Start
  ├─> Check SecureStore for token & user
  │   ├─> If exists: Set credentials & navigate to Home
  │   └─> If not: Show Home (guest mode)
  │
Home Screen
  └─> Navigate to Login
      ├─> Login Success
      │   ├─> Admin → AdminDashboard
      │   ├─> Instructor → InstructorDashboard
      │   └─> Student → Home
      │
      ├─> Navigate to Register
      └─> Navigate to ForgotPassword
```

## 🛠️ Troubleshooting

### Lỗi: "Network request failed"
- Kiểm tra server đang chạy: `npm run dev` trong folder `server`
- Kiểm tra IP address trong `.env` đúng với IP LAN của máy
- Kiểm tra điện thoại và máy tính cùng mạng WiFi

### Lỗi: Google/Facebook login không hoạt động
- Kiểm tra Client ID/App ID trong `.env`
- Với Expo Go, cần dùng Web Client ID cho Google
- Kiểm tra redirect URIs trong Google/Facebook console

### Lỗi: "Cannot find module"
- Chạy lại: `npm install`
- Clear cache: `npx expo start -c`

## 📝 TODO

- [ ] Implement Register API integration
- [ ] Implement Forgot Password API integration
- [ ] Add OTP verification screens
- [ ] Add form validation với Formik/Yup
- [ ] Add Toast notifications thay vì Alert
- [ ] Add biometric authentication (Face ID/Touch ID)
- [ ] Add persistent login với Remember Me
- [ ] Add loading screen khi check auth status

## 🎨 Design System

### Colors (Tailwind)
- Primary: `rose-500` (#F43F5E)
- Gray scale: `gray-50` đến `gray-900`

### Typography
- Heading: `text-[44px] font-extrabold`
- Body: `text-[15px]`
- Label: `text-[15px] font-medium`

### Components
- Input: `rounded-2xl border border-gray-200`
- Button: `rounded-full py-5 bg-rose-500`
- Icons: Lucide React Native (18px)

## 📚 Dependencies chính

- **React Navigation**: Navigation
- **Redux Toolkit**: State management
- **Axios**: HTTP client
- **NativeWind**: Tailwind CSS for React Native
- **Expo Auth Session**: OAuth authentication
- **Expo Secure Store**: Secure token storage
- **Lucide React Native**: Icons

## 🤝 Liên hệ

Nếu có vấn đề, vui lòng tạo issue hoặc liên hệ team phát triển.
