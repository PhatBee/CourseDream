# 🔄 Hướng dẫn Refresh Token - DreamsLMS

## 📋 Tổng quan

Hệ thống sử dụng **JWT (JSON Web Token)** với 2 loại token:

1. **Access Token** - Thời gian sống ngắn (15 phút)
2. **Refresh Token** - Thời gian sống dài (7 ngày)

---

## 🔐 Cơ chế hoạt động

### 1. **Đăng nhập**

```
User → Login → Server
                  ↓
            Tạo Access Token (15m)
            Tạo Refresh Token (7d)
                  ↓
            Lưu Refresh Token vào DB
            Set cookies (Web) / Return tokens (Mobile)
                  ↓
            Client lưu tokens
```

### 2. **Request với Access Token**

```
Client → Request + Access Token → Server
                                     ↓
                              Verify Access Token
                                     ↓
                              ✅ Valid → Process Request
                              ❌ Expired → Return 401 + code: "TOKEN_EXPIRED"
```

### 3. **Auto Refresh Token**

```
Client nhận 401 + "TOKEN_EXPIRED"
         ↓
Client gọi /auth/refresh-token với Refresh Token
         ↓
Server verify Refresh Token
         ↓
✅ Valid → Tạo Access Token mới + Refresh Token mới
         ↓
Client lưu tokens mới
         ↓
Client retry request ban đầu với Access Token mới
         ↓
✅ Success
```

---

## 🛠️ Implementation

### **Server Side**

#### 1. Auth Middleware (`auth.middleware.js`)

```javascript
export const verifyToken = async (req, res, next) => {
  try {
    // Lấy token từ cookie hoặc header
    let token = req.cookies.accessToken;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ 
        message: "No token provided",
        code: "NO_TOKEN"
      });
    }

    // Verify token
    const decoded = verifyJWT(token);
    
    // Tìm user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    req.user = user;
    next();
  } catch (err) {
    // Phân biệt loại lỗi
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Access token expired",
        code: "TOKEN_EXPIRED" // ← Client dùng code này để refresh
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: "Invalid token",
        code: "INVALID_TOKEN"
      });
    } else {
      return res.status(401).json({ 
        message: "Authentication failed",
        code: "AUTH_FAILED"
      });
    }
  }
};
```

**Key Points:**
- ✅ Phân biệt `TokenExpiredError` vs `JsonWebTokenError`
- ✅ Trả về `code` để client biết cách xử lý
- ✅ Hỗ trợ cả cookie (web) và Bearer token (mobile)

#### 2. Refresh Token Controller

```javascript
export const refreshToken = async (req, res, next) => {
  try {
    // Web: lấy từ cookie
    const refreshToken = req.cookies.refreshToken;
    
    // Mobile: lấy từ header
    // const refreshToken = req.headers.authorization?.split(" ")[1];

    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshTokenService(refreshToken);

    // Set cookies cho web
    setCookies(res, accessToken, newRefreshToken);

    // Return tokens cho cả web và mobile
    res.status(200).json({
      message: 'Refresh token thành công!',
      accessToken,
      refreshToken: newRefreshToken // Mobile cần field này
    });
  } catch (error) {
    next(error);
  }
};
```

#### 3. Refresh Token Service

```javascript
export const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh token không tồn tại');
    error.statusCode = 401;
    throw error;
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    const err = new Error('Refresh token không hợp lệ hoặc đã hết hạn');
    err.statusCode = 403;
    throw err;
  }

  // Tìm user và kiểm tra refresh token trong DB
  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken) {
    const error = new Error('Refresh token không hợp lệ');
    error.statusCode = 403;
    throw error;
  }

  // Tạo tokens mới
  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  // Lưu refresh token mới vào DB
  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
```

---

### **Client Side (Web)**

#### Axios Interceptor

```javascript
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Danh sách public endpoints (không cần refresh)
    const publicAuthEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/verify-otp',
      '/auth/google',
      '/auth/facebook',
      '/auth/forgot-password',
      '/auth/verify-reset-otp',
      '/auth/set-password'
    ];

    const isPublicEndpoint = publicAuthEndpoints.some(endpoint => 
      originalRequest.url?.includes(endpoint)
    );

    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh-token');

    // Nếu 401, chưa retry, không phải public/refresh endpoint
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !isPublicEndpoint &&
      !isRefreshEndpoint
    ) {
      originalRequest._retry = true;

      try {
        console.log('🔄 Token expired, refreshing...');
        
        // Gọi refresh token (cookies tự động gửi)
        await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        console.log('✅ Token refreshed');

        // Retry request ban đầu
        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Refresh failed');
        
        // Logout
        localStorage.removeItem('user');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

**Key Points:**
- ✅ Chỉ skip refresh cho **public endpoints**
- ✅ Không skip cho **protected auth endpoints** (như `/auth/me`, `/auth/change-password`)
- ✅ Tránh infinite loop bằng cách skip `/auth/refresh-token`
- ✅ Cookies tự động gửi, không cần thêm header

---

### **Client Side (Mobile)**

#### Axios Interceptor

```javascript
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Danh sách public endpoints
    const publicAuthEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/verify-otp',
      '/auth/google',
      '/auth/facebook',
      '/auth/forgot-password',
      '/auth/verify-reset-otp',
      '/auth/set-password'
    ];

    const isPublicEndpoint = publicAuthEndpoints.some(endpoint =>
      originalRequest.url?.includes(endpoint)
    );

    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh-token');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicEndpoint &&
      !isRefreshEndpoint
    ) {
      originalRequest._retry = true;

      try {
        console.log('🔄 Token expired, refreshing...');

        // Lấy refresh token từ storage
        const refreshToken = await getRefreshToken();

        // Gọi refresh token API
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        console.log('✅ Token refreshed');

        // Lưu tokens mới
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await saveAccessToken(accessToken);
        await saveRefreshToken(newRefreshToken);

        // Retry với token mới
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ Refresh failed');

        // Logout
        await clearAuthData();
        store.dispatch(logout());

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

**Key Points:**
- ✅ Mobile **không có cookies**, phải gửi refresh token qua header
- ✅ Lưu cả `accessToken` và `refreshToken` vào AsyncStorage
- ✅ Logic tương tự web nhưng khác cách lưu trữ

---

## 🧪 Testing

### Test Case 1: Token hết hạn sau 15 phút

```bash
# 1. Đăng nhập
POST /api/auth/login
→ Nhận access token (15m) + refresh token (7d)

# 2. Đợi 16 phút

# 3. Gọi protected endpoint
GET /api/user/profile
→ Nhận 401 + code: "TOKEN_EXPIRED"

# 4. Client tự động gọi refresh
POST /api/auth/refresh-token
→ Nhận access token mới + refresh token mới

# 5. Client retry request
GET /api/user/profile
→ ✅ Success
```

### Test Case 2: Refresh token hết hạn

```bash
# 1. Đăng nhập
POST /api/auth/login

# 2. Đợi 8 ngày (refresh token hết hạn)

# 3. Gọi protected endpoint
GET /api/user/profile
→ Nhận 401

# 4. Client gọi refresh
POST /api/auth/refresh-token
→ ❌ 403 "Refresh token hết hạn"

# 5. Client logout và redirect về login
```

### Test Case 3: Multiple requests cùng lúc

```bash
# 1. Token sắp hết hạn

# 2. Gọi 3 requests cùng lúc
GET /api/courses
GET /api/user/profile
GET /api/enrollments

# 3. Tất cả đều nhận 401

# 4. Chỉ 1 request gọi refresh (nhờ _retry flag)
POST /api/auth/refresh-token

# 5. Tất cả 3 requests retry với token mới
→ ✅ Success
```

---

## 🐛 Troubleshooting

### Vấn đề 1: Infinite loop refresh

**Nguyên nhân:** Không skip `/auth/refresh-token` endpoint

**Giải pháp:**
```javascript
const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh-token');
if (!isRefreshEndpoint) {
  // Refresh logic
}
```

### Vấn đề 2: Protected auth endpoints không refresh

**Nguyên nhân:** Skip tất cả `/auth/` endpoints

**Giải pháp:** Chỉ skip public endpoints
```javascript
const publicAuthEndpoints = ['/auth/login', '/auth/register', ...];
const isPublicEndpoint = publicAuthEndpoints.some(...);
```

### Vấn đề 3: Mobile không refresh được

**Nguyên nhân:** Không gửi refresh token trong header

**Giải pháp:**
```javascript
const refreshToken = await getRefreshToken();
await axios.post('/auth/refresh-token', {}, {
  headers: { Authorization: `Bearer ${refreshToken}` }
});
```

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Refresh Token Flow                       │
└─────────────────────────────────────────────────────────────┘

1. User đăng nhập
   ↓
2. Server tạo Access Token (15m) + Refresh Token (7d)
   ↓
3. Client lưu tokens
   ↓
4. Client gọi API với Access Token
   ↓
5. Access Token hết hạn (sau 15m)
   ↓
6. Server trả về 401 + code: "TOKEN_EXPIRED"
   ↓
7. Client interceptor bắt lỗi 401
   ↓
8. Client gọi /auth/refresh-token với Refresh Token
   ↓
9. Server verify Refresh Token
   ├─ ✅ Valid → Tạo tokens mới
   │             ↓
   │          Return tokens mới
   │             ↓
   │          Client lưu tokens mới
   │             ↓
   │          Client retry request ban đầu
   │             ↓
   │          ✅ Success
   │
   └─ ❌ Invalid/Expired → Return 403
                             ↓
                          Client logout
                             ↓
                          Redirect to login
```

---

## ✅ Checklist

### Server
- [x] Auth middleware phân biệt `TokenExpiredError`
- [x] Trả về `code` trong response
- [x] Refresh token endpoint hoạt động
- [x] Lưu refresh token vào DB
- [x] Verify refresh token từ DB

### Web Client
- [x] Axios interceptor bắt 401
- [x] Chỉ skip public endpoints
- [x] Gọi refresh token API
- [x] Retry request ban đầu
- [x] Logout khi refresh thất bại

### Mobile Client
- [x] Axios interceptor bắt 401
- [x] Chỉ skip public endpoints
- [x] Gửi refresh token qua header
- [x] Lưu tokens mới vào AsyncStorage
- [x] Retry request ban đầu
- [x] Logout khi refresh thất bại

---

## 🎯 Best Practices

1. **Access Token ngắn (15m)** - Giảm thiểu rủi ro nếu bị đánh cắp
2. **Refresh Token dài (7d)** - UX tốt, không phải login thường xuyên
3. **Lưu Refresh Token vào DB** - Có thể revoke khi cần
4. **Rotate Refresh Token** - Tạo refresh token mới mỗi lần refresh
5. **Phân biệt error codes** - Client xử lý đúng từng trường hợp
6. **Tránh infinite loop** - Skip refresh endpoint
7. **Chỉ skip public endpoints** - Protected endpoints vẫn refresh được

---

**Hoàn thành! 🎉**

Hệ thống refresh token đã được đồng bộ hoàn toàn giữa Server, Web Client và Mobile Client.
