# Video Interactive Quiz — Sửa lỗi toàn diện & Tính năng mới

Sửa triệt để 4 lỗi/tính năng liên quan đến Video Quiz Interactive trên cả Web (React) và Mobile (Expo), bao gồm: logic khóa tua, xem lại/làm lại quiz, marker timeline, và chặn tua vượt rào.

---

## Root-Cause Analysis (Phân tích gốc rễ)

Sau khi đọc toàn bộ mã nguồn, tôi xác định các nguyên nhân gốc rễ sau:

### Bug 1: Seek Lock không mở khóa sau khi trả lời & Quiz biến mất khi quay lại

**Nguyên nhân Web** ([useVideoQuiz.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/client/src/features/learning/useVideoQuiz.js#L27-L28)):
- `triggeredRef` lưu các quiz đã trigger. Khi trả lời đúng → `markQuizComplete` chạy → `activeQuiz = null`, `quizBlocked = false` ✅
- **Nhưng** `triggeredRef` vẫn giữ `quizIndex` đó → khi video replay hoặc seek lại vùng timestamp, quiz **không bao giờ trigger lại** → marker vẫn hiện nhưng quiz overlay "biến mất"
- `checkSeekBlock` ([L67-86](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/client/src/features/learning/useVideoQuiz.js#L67-L86)) không so sánh với `currentTime` trước khi seek → nếu user seek backward (tua ngược), seek vẫn bị block sai

**Nguyên nhân Mobile** ([VideoPlayer.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/course-app/src/components/learning/VideoPlayer.js#L296-L356)):
- Gatekeeper logic chạy trong `timeUpdate` listener, nhưng `activeQuiz` và `quizBlocked` nằm trong dependency array → **mỗi lần state thay đổi, subscription bị tạo lại** → race condition
- `handleQuizCorrect` ([L441-446](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/course-app/src/components/learning/VideoPlayer.js#L441-L446)) clear `activeQuiz` và `quizBlocked`, nhưng ngay lập tức `timeUpdate` fire lại → có thể re-trigger quiz vừa trả lời vì `completedQuizzes` chưa kịp update trong Redux store

### Bug 3: Marker ẩn/hiện không ổn định

**Nguyên nhân** ([QuizProgressMarkers.jsx](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/client/src/components/learning/QuizProgressMarkers.jsx#L219-L269)):
- `containerRef` inject vào DOM qua `useEffect` với dependency `[playerRef, quizzes.length, lectureId]`
- Khi Video.js dispose và re-init (đổi bài rồi quay lại), **DOM container bị xóa nhưng `mountedRef` vẫn `true`** → không inject lại → markers biến mất
- `playerRef.current` có thể thay đổi reference mà `useEffect` không detect được (ref thay đổi không trigger re-render)

### Thiếu Feature 2: Review & Retake Quiz

- Chưa có API endpoint nào cho reset quiz
- `CompletedQuizSchema` ([progress.model.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/server/src/modules/progress/progress.model.js#L15-L19)) chỉ lưu `answeredAt`, không lưu `selectedAnswer` → không thể xem lại lịch sử

### Thiếu Feature 4: Forward Seek Restriction (Chặn tua vượt rào)

- `checkSeekBlock` hiện tại ([useVideoQuiz.js L67-86](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/client/src/features/learning/useVideoQuiz.js#L67-L86)) đã có logic cơ bản nhưng **thiếu so sánh với vị trí trước khi seek** → block cả seek backward lẫn forward
- Mobile ([VideoPlayer.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/course-app/src/components/learning/VideoPlayer.js#L146-L159)) `handleSeek` **không có logic chặn nào** → user tua thoải mái qua mọi quiz

---

## Proposed Changes

### 1. Database Schema — Progress Model

#### [MODIFY] [progress.model.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/server/src/modules/progress/progress.model.js)

Mở rộng `CompletedQuizSchema` để lưu lịch sử:

```javascript
const CompletedQuizSchema = new mongoose.Schema({
  lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  quizIndex: { type: Number, required: true },
  selectedAnswer: { type: String, required: true },  // ← MỚI: Lưu đáp án đã chọn
  isCorrect: { type: Boolean, default: true },        // ← MỚI: Kết quả
  answeredAt: { type: Date, default: Date.now },
  attempts: { type: Number, default: 1 },             // ← MỚI: Số lần thử
}, { _id: false });
```

> [!NOTE]
> Schema mới backward-compatible: `selectedAnswer` và `isCorrect` có default values, documents cũ vẫn hoạt động bình thường.

---

### 2. Backend — Progress Service & Routes

#### [MODIFY] [progress.service.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/server/src/modules/progress/progress.service.js)

1. **`submitQuizAnswer`** — Sửa logic lưu thêm `selectedAnswer`, `isCorrect`, `attempts`
2. **`resetQuiz` (MỚI)** — Reset 1 quiz cụ thể (xóa entry khỏi `completedQuizzes`)
3. **`resetAllQuizzes` (MỚI)** — Reset toàn bộ quiz của 1 lecture
4. **`getQuizHistory` (MỚI)** — Trả về lịch sử quiz đã làm cho 1 lecture

#### [MODIFY] [progress.controller.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/server/src/modules/progress/progress.controller.js)

Thêm 3 controller methods: `resetQuiz`, `resetAllQuizzes`, `getQuizHistory`

#### [MODIFY] [progress.routes.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/server/src/modules/progress/progress.routes.js)

Thêm routes:
```
DELETE /api/progress/quiz-reset           → Reset 1 quiz
DELETE /api/progress/quiz-reset-all       → Reset all quizzes cho 1 lecture
GET    /api/progress/quiz-history/:courseSlug/:lectureId → Lịch sử quiz
```

---

### 3. Frontend Web — Sửa lỗi Logic & UX

#### [MODIFY] [useVideoQuiz.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/client/src/features/learning/useVideoQuiz.js)

**Thay đổi chính:**

1. **Fix seek block**: `checkSeekBlock` thêm tham số `currentTimeBefore` để chỉ block **forward seek**, không block backward seek
2. **Fix triggeredRef**: Xóa quizIndex khỏi `triggeredRef` khi quiz được reset/retake
3. **Thêm `resetQuizAttempt`**: Gọi API reset quiz + clear state local
4. **Thêm `fetchQuizHistory`**: Gọi API lấy lịch sử quiz
5. **Lưu `lastKnownTime` ref**: Dùng để phân biệt forward vs backward seek

#### [MODIFY] [learningSlice.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/client/src/features/learning/learningSlice.js) (Web)

1. Thêm reducer `removeQuizComplete` — xóa 1 entry khỏi `completedQuizzes` (cho reset)
2. Thêm reducer `removeAllQuizzesForLecture` — xóa tất cả entries của 1 lecture

#### [MODIFY] [VideoPlayer.jsx](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/client/src/components/learning/VideoPlayer.jsx)

1. **Fix `handleSeeking`**: Pass `lastKnownTime` vào `checkSeekBlock` để chỉ chặn forward seek
2. **Fix `onCorrect` callback**: Thêm small delay (100ms) trước khi resume để tránh race condition với `checkSeekBlock`

#### [MODIFY] [VideoQuizOverlay.jsx](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/client/src/components/learning/VideoQuizOverlay.jsx)

1. Khi `feedback === 'correct'`, hiện thêm nút "Tiếp tục" (phòng timeout không hoạt động)
2. Sau khi trả lời sai, hiện rõ số lần thử (`attempt count`)

#### [MODIFY] [QuizProgressMarkers.jsx](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/client/src/components/learning/QuizProgressMarkers.jsx)

**Fix marker ẩn/hiện:**

1. Thay `mountedRef` bằng logic **detect DOM container tồn tại** mỗi render cycle
2. Thêm `MutationObserver` hoặc re-inject logic khi phát hiện container đã bị Video.js dispose
3. Thêm cleanup chặt chẽ hơn khi `lectureId` thay đổi

#### [MODIFY] [learningApi.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/client/src/api/learningApi.js)

Thêm 3 API methods: `resetQuiz`, `resetAllQuizzes`, `getQuizHistory`

---

### 4. Frontend Mobile (Expo) — Sửa lỗi Logic & UX

#### [MODIFY] [learningSlice.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/course-app/src/features/learning/learningSlice.js) (Mobile)

1. Thêm quiz state fields giống Web: `activeQuiz`, `quizBlocked`, `completedQuizzes` (top-level)
2. Thêm reducers: `showQuiz`, `dismissQuiz`, `removeQuizComplete`, `removeAllQuizzesForLecture`

#### [MODIFY] [VideoPlayer.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/course-app/src/components/learning/VideoPlayer.js) (Mobile)

**Thay đổi chính:**

1. **Fix Gatekeeper race condition**: Dùng `useRef` cho `activeQuiz` và `quizBlocked` bên trong `timeUpdate` listener thay vì state (tránh dependency array re-subscribe)
2. **Fix `handleSeek`**: Thêm forward seek restriction — check quiz chưa làm giữa `currentTime` và `seekTarget`, snap back nếu cần
3. **Fix `handleForward5s`**: Cũng phải check quiz block trước khi tua
4. **Fix `handleQuizCorrect`**: Thêm debounce 200ms trước khi resume → tránh `timeUpdate` fire lại ngay lập tức re-trigger quiz

#### [MODIFY] [CustomProgressBar.js](file:///d:/Nam_4/TieuLuanChuyenNganh/Dream/course-app/src/components/learning/CustomProgressBar.js)

1. `onPanResponderRelease`: Thêm logic forward seek restriction trước khi gọi `onSeek` (hoặc delegate lên parent)

---

## Open Questions

> [!IMPORTANT]
> **Chính sách Retake Quiz**: Khi user reset quiz, cần xác nhận behavior mong muốn:
> - **Option A**: Reset quiz → user phải trả lời lại (seek lock reactivate cho quiz đó). Quiz marker chuyển từ ✓ xanh về ? vàng.
> - **Option B**: Reset quiz → chỉ xóa lịch sử, nhưng seek lock **không** reactivate (user vẫn tua qua thoải mái). Quiz sẽ hiện overlay khi phát đến timestamp nhưng không block.
> - **Đề xuất**: Option A — consistent với UX "bắt buộc trả lời trước khi tua qua".

> [!IMPORTANT]
> **Giới hạn số lần Retake?**: Có nên giới hạn số lần reset quiz không? (Ví dụ: tối đa 3 lần retake mỗi quiz)
> - **Đề xuất**: Không giới hạn (unlimited retake), vì mục đích là học tập.

> [!IMPORTANT]
> **UI xem lại quiz history**: Hiện ở đâu?
> - **Option A**: Tab mới trong area dưới video ("Câu hỏi")
> - **Option B**: Trong QuizOverlay, thêm nút "Xem lại lịch sử" khi quiz đã hoàn thành
> - **Option C**: Cả hai
> - **Đề xuất**: Option B — tích hợp trực tiếp vào marker/overlay, không cần tab mới.

---

## Verification Plan

### Automated Tests
Không có test framework hiện hữu trong project → sẽ verify thủ công.

### Manual Verification
1. **Seek Lock Fix**: Đến mốc quiz → trả lời đúng → verify có thể tua forward/backward ngay lập tức
2. **Quiz persistence**: Trả lời quiz → chuyển bài → quay lại → verify marker vẫn hiện (✓ xanh) và quiz không biến mất
3. **Forward seek block**: Cố tua qua quiz chưa trả lời → verify video snap back về đúng mốc quiz
4. **Backward seek**: Tua ngược (về phía trước quiz) → verify KHÔNG bị block
5. **Reset quiz**: Bấm reset → verify marker chuyển về ? vàng → phải trả lời lại khi đến timestamp
6. **Marker stability**: Load video → verify tất cả markers render ngay lập tức → đổi bài → quay lại → verify markers vẫn hiện
7. **Mobile**: Lặp lại tất cả test cases trên Expo app

