# Cart Module

## Overview
Module giỏ hàng cho phép người dùng thêm, xóa và quản lý các khóa học trước khi thanh toán.

## Database Schema

### Cart Model
```javascript
{
  student: ObjectId,        // Reference to User
  items: [CartItem],        // Array of cart items
  totalItems: Number,       // Total number of items
  subtotal: Number,         // Total price before discount
  totalDiscount: Number,    // Total discount amount
  total: Number,            // Final total after discount
  createdAt: Date,
  updatedAt: Date
}
```

### CartItem Schema
```javascript
{
  course: ObjectId,         // Reference to Course
  price: Number,            // Original price at time of adding
  priceDiscount: Number,    // Discounted price at time of adding
  addedAt: Date            // When item was added to cart
}
```

## API Endpoints

### 1. Get Cart
**GET** `/api/cart`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "student": "...",
    "items": [
      {
        "course": {
          "_id": "...",
          "title": "Course Title",
          "slug": "course-slug",
          "thumbnail": "...",
          "price": 1000000,
          "priceDiscount": 800000,
          "instructor": {...},
          "categories": [...]
        },
        "price": 1000000,
        "priceDiscount": 800000,
        "addedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "totalItems": 1,
    "subtotal": 1000000,
    "totalDiscount": 200000,
    "total": 800000
  }
}
```

### 2. Add to Cart
**POST** `/api/cart/add`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "courseId": "course_object_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course added to cart successfully",
  "data": { /* cart object */ }
}
```

**Errors:**
- `400`: Course ID is required / Invalid course ID format / Course already in cart
- `404`: Course not found
- `500`: Server error

### 3. Remove from Cart
**DELETE** `/api/cart/remove/:courseId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Course removed from cart successfully",
  "data": { /* updated cart object */ }
}
```

### 4. Clear Cart
**DELETE** `/api/cart/clear`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": { /* empty cart object */ }
}
```

### 5. Update Cart Prices
**PUT** `/api/cart/update-prices`

**Headers:**
```
Authorization: Bearer <token>
```

**Description:** Cập nhật giá của các items trong cart nếu giá course thay đổi

**Response:**
```json
{
  "success": true,
  "message": "Cart prices updated successfully",
  "data": { /* updated cart object */ }
}
```

## Features

### Auto-calculation
- Cart tự động tính toán `totalItems`, `subtotal`, `totalDiscount`, và `total` mỗi khi có thay đổi
- Sử dụng method `calculateTotals()` trong model

### Price Snapshot
- Khi thêm course vào cart, giá được lưu lại tại thời điểm đó
- Có thể cập nhật giá bằng endpoint `/update-prices` nếu cần

### Validation
- Kiểm tra courseId format (MongoDB ObjectId)
- Kiểm tra course tồn tại
- Kiểm tra duplicate items

### Population
- Tự động populate course details khi lấy cart
- Bao gồm instructor và categories information

## Usage Example

```javascript
// Frontend - Add to cart
const addToCart = async (courseId) => {
  try {
    const response = await fetch('http://localhost:5000/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ courseId })
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
};

// Frontend - Get cart
const getCart = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
};
```

## Integration with Other Modules

### With Course Module
- References Course model
- Validates course existence before adding

### With User/Auth Module
- Requires authentication (verifyToken middleware)
- Each user has one unique cart

### With Payment Module
- Cart data can be used for checkout process
- After successful payment, cart should be cleared

### With Enrollment Module
- After payment, items in cart become enrollments
- Prevent adding already enrolled courses to cart (can be added in future)

## Notes

- Mỗi user chỉ có 1 cart (unique constraint trên student field)
- Cart được tự động tạo khi user lần đầu thêm item
- Giá được snapshot tại thời điểm thêm vào cart
- Indexes được tạo cho performance optimization
