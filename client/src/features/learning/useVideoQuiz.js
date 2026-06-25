// client/src/features/learning/useVideoQuiz.js
import { useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showQuiz, markQuizComplete, removeQuizComplete, removeAllQuizzesForLecture } from './learningSlice';
import { learningApi } from '../../api/learningApi';
import { toast } from 'react-toastify';

/**
 * Hook quản lý toàn bộ logic Interactive Video Quiz cho VideoPlayer (web)
 *
 * ✅ FIX v3 — Race Condition Fix:
 *   - isSeekingRef: flag đóng băng lastKnownTimeRef trong suốt quá trình seek
 *     → ngăn timeupdate ghi đè "beforeTime" khi user click timeline
 *   - pendingRetakeRef: đảm bảo quiz hiện lại 100% sau retake, không phụ thuộc
 *     vào timeupdate window timing hay bước nhảy của Video.js
 *   - notifySeekStart / notifySeekEnd: API để VideoJSPlayer báo hiệu trạng thái seek
 *
 * @param {string} courseSlug
 * @param {string} lectureId
 * @param {Array}  quizzes     - Mảng quiz của lecture hiện tại
 */
export function useVideoQuiz(courseSlug, lectureId, quizzes = []) {
  const dispatch = useDispatch();
  const { completedQuizzes, activeQuiz, quizBlocked } = useSelector(s => s.learning);

  // Set lưu quizIndex đã TRIGGER trong session này (tránh re-trigger khi replay vùng timestamp)
  const triggeredRef = useRef(new Set());

  // ✅ FIX v3 — Lưu vị trí video TRƯỚC khi seek (giá trị "beforeTime" đáng tin cậy)
  const lastKnownTimeRef = useRef(0);

  // ✅ FIX v3 — Flag: đang trong quá trình seek? → đóng băng lastKnownTimeRef
  // Được set = true tại onSeekStart (TRƯỚC khi seeking/timeupdate bắn)
  // Được set = false tại onSeekEnd (sau khi seeked hoàn thành)
  const isSeekingRef = useRef(false);

  // ✅ FIX v3 — Khi retake quiz, lưu quizIndex cần trigger ngay lập tức
  // thay vì chờ timeupdate window (giải quyết vấn đề bước nhảy > 1.5s)
  const pendingRetakeRef = useRef(null);

  // ─── Kiểm tra quiz đã hoàn thành ĐÚNG (so sánh với state từ server) ────────
  const isQuizDone = useCallback((quizIndex) => {
    if (!lectureId) return false;
    return completedQuizzes.some(
      q => String(q.lectureId) === String(lectureId)
        && q.quizIndex === quizIndex
        && q.isCorrect !== false // backward-compat: entries cũ không có isCorrect → xem như đúng
    );
  }, [completedQuizzes, lectureId]);

  // ─── notifySeekStart — gọi từ VideoJSPlayer tại sự kiện "seeking" ────────────
  /**
   * ✅ FIX v3: Đóng băng lastKnownTimeRef NGAY KHI user bắt đầu seek.
   * Phải gọi TRƯỚC khi timeupdate có cơ hội ghi đè giá trị.
   * VideoJSPlayer sẽ gọi hàm này trong handler "seeking" (ưu tiên cao nhất).
   */
  const notifySeekStart = useCallback(() => {
    isSeekingRef.current = true;
    // lastKnownTimeRef.current giữ nguyên — không thay đổi trong suốt quá trình seek
  }, []);

  // ─── notifySeekEnd — gọi từ VideoJSPlayer tại sự kiện "seeked" ───────────────
  /**
   * ✅ FIX v3: Cập nhật lastKnownTimeRef với vị trí sau seek, mở khóa flag.
   */
  const notifySeekEnd = useCallback((currentTimeSec) => {
    lastKnownTimeRef.current = currentTimeSec;
    isSeekingRef.current = false;
  }, []);

  // ─── onTimeUpdate — gắn vào video element ────────────────────────────────────
  /**
   * Gọi từ onTimeUpdate event của video.
   *
   * ✅ FIX v3: Hoàn toàn bỏ qua cập nhật lastKnownTimeRef khi isSeekingRef = true.
   * Điều này triệt tiêu race condition giữa timeupdate và seeking:
   *   - Khi user click timeline: seeking → isSeekingRef = true → timeupdate bị ignore
   *   - checkSeekBlock đọc lastKnownTimeRef vẫn là vị trí trước khi seek → chặn đúng
   *
   * ✅ FIX v3: Kiểm tra pendingRetakeRef để trigger quiz ngay lập tức sau retake
   * (không phụ thuộc vào timeupdate có nằm trong window [ts, ts+2.5] hay không).
   */
  const onTimeUpdate = useCallback((currentTimeSec) => {
    // ✅ Không cập nhật lastKnownTimeRef khi đang trong quá trình seek
    if (!isSeekingRef.current) {
      const diff = currentTimeSec - lastKnownTimeRef.current;
      // Chỉ cập nhật khi phát tự nhiên (tiến đều ≤ 1.5s) hoặc backward (revert từ block)
      const isNormalProgression = (diff > 0 && diff < 1.5) || diff < 0;
      if (isNormalProgression) {
        lastKnownTimeRef.current = currentTimeSec;
      }
    }

    if (quizBlocked || !quizzes.length) return;

    // ✅ FIX v3: Ưu tiên kiểm tra pendingRetakeRef — trigger ngay nếu đang ở vùng quiz
    if (pendingRetakeRef.current !== null) {
      const retakeIdx = pendingRetakeRef.current;
      const quiz = quizzes[retakeIdx];
      if (quiz && quiz.isActive !== false) {
        const ts = Number(quiz.timestamp);
        // Trigger nếu video đã đến gần vùng quiz (rộng hơn: ts-0.5 đến ts+3)
        if (currentTimeSec >= ts - 0.5 && currentTimeSec <= ts + 3) {
          pendingRetakeRef.current = null; // clear pending
          triggeredRef.current.add(retakeIdx);
          dispatch(showQuiz({ quizIndex: retakeIdx, quiz }));
          return;
        }
      } else {
        pendingRetakeRef.current = null; // quiz không hợp lệ → clear
      }
    }

    // Kiểm tra quiz thông thường theo window [ts, ts+2.5]
    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i];
      if (quiz.isActive === false) continue;

      const ts = Number(quiz.timestamp);
      const inWindow = currentTimeSec >= ts && currentTimeSec <= ts + 2.5;

      if (inWindow && !isQuizDone(i) && !triggeredRef.current.has(i)) {
        triggeredRef.current.add(i);
        dispatch(showQuiz({ quizIndex: i, quiz }));
        return; // Chỉ show 1 quiz tại 1 thời điểm
      }
    }
  }, [quizzes, quizBlocked, isQuizDone, dispatch]);

  // ─── onSeeked — gọi từ seeked event sau khi seek hoàn thành ────────────────────
  /**
   * Alias cho notifySeekEnd — dùng để backward-compatible với VideoJSPlayer cũ.
   * Trong VideoJSPlayer mới, gọi notifySeekEnd trực tiếp.
   */
  const onSeeked = useCallback((currentTimeSec) => {
    notifySeekEnd(currentTimeSec);
  }, [notifySeekEnd]);

  // ─── checkSeekBlock — gọi từ onSeeking event ─────────────────────────────────
  /**
   * ✅ FIX v3: Không cần nhận currentTimeBefore nữa vì isSeekingRef đã đảm bảo
   * lastKnownTimeRef không bị ghi đè khi timeupdate chạy song song.
   * Vẫn hỗ trợ truyền currentTimeBefore để backward-compatible.
   *
   * @param {number} seekToSec           - giây user muốn tua đến
   * @param {number} [currentTimeBefore] - giây trước khi seek (optional override)
   * @returns {{ blocked: boolean, revertTo: number|null, blockedQuiz: object|null }}
   */
  const checkSeekBlock = useCallback((seekToSec, currentTimeBefore) => {
    if (!quizzes.length) return { blocked: false, revertTo: null, blockedQuiz: null };

    // ✅ FIX v3: lastKnownTimeRef đã được đóng băng trước khi hàm này chạy
    // (do notifySeekStart được gọi trong handler "seeking" TRƯỚC checkSeekBlock)
    const beforeTime = currentTimeBefore ?? lastKnownTimeRef.current;

    // Chỉ chặn FORWARD seek (seekTo > beforeTime)
    // Backward seek luôn được phép
    if (seekToSec <= beforeTime) {
      return { blocked: false, revertTo: null, blockedQuiz: null };
    }

    // Sắp xếp theo timestamp tăng dần
    const sortedQuizzes = [...quizzes]
      .map((q, i) => ({ ...q, index: i }))
      .filter(q => q.isActive !== false)
      .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

    // Tìm quiz chưa làm nằm GIỮA beforeTime và seekToSec
    for (const quiz of sortedQuizzes) {
      const ts = Number(quiz.timestamp);
      if (!isQuizDone(quiz.index) && ts > beforeTime && seekToSec > ts) {
        return {
          blocked: true,
          revertTo: Math.max(0, ts - 1), // Revert về 1s trước mốc quiz
          blockedQuiz: quiz,
        };
      }
    }
    return { blocked: false, revertTo: null, blockedQuiz: null };
  }, [quizzes, isQuizDone]);

  // ─── submitAnswer — gọi từ VideoQuizOverlay ──────────────────────────────────
  /**
   * Submit đáp án lên server, server validate.
   * @param {number} quizIndex
   * @param {string} answer - 'A'|'B'|'C'|'D'
   * @returns {{ correct: boolean, hint: string|null }}
   */
  const submitAnswer = useCallback(async (quizIndex, answer) => {
    if (!courseSlug || !lectureId) return { correct: false, hint: null };
    try {
      const res = await learningApi.submitQuizAnswer({
        courseSlug,
        lectureId,
        quizIndex,
        answer,
      });
      const { correct, hint } = res.data.data;

      if (correct) {
        dispatch(markQuizComplete({ lectureId, quizIndex, selectedAnswer: answer }));
      }
      return { correct, hint: hint || null };
    } catch (err) {
      toast.error('Lỗi kết nối, thử lại sau!', { toastId: 'quiz-err' });
      return { correct: false, hint: null };
    }
  }, [courseSlug, lectureId, dispatch]);

  // ─── resetQuizAttempt — reset 1 quiz để làm lại (non-optimistic) ─────────────
  /**
   * Non-optimistic: chờ server confirm trước, rồi mới cập nhật Redux.
   * Trả về { success: boolean } để caller biết kết quả.
   */
  const resetQuizAttempt = useCallback(async (quizIndex) => {
    if (!courseSlug || !lectureId) return { success: false };
    try {
      await learningApi.resetQuiz({ courseSlug, lectureId, quizIndex });
      // ✅ Chỉ dispatch SAU khi server thành công
      dispatch(removeQuizComplete({ lectureId, quizIndex }));
      // ✅ FIX: Xóa khỏi triggeredRef để quiz có thể trigger lại
      triggeredRef.current.delete(quizIndex);
      toast.success('↺ Đã reset! Tua video về vị trí câu hỏi để làm lại.', { toastId: 'quiz-reset', autoClose: 4000 });
      return { success: true };
    } catch (err) {
      toast.error('Không thể reset quiz. Vui lòng thử lại.', { toastId: 'quiz-reset-err' });
      return { success: false };
    }
  }, [courseSlug, lectureId, dispatch]);

  // ─── resetAllQuizAttempts — reset toàn bộ quiz của lecture (non-optimistic) ──
  /**
   * Non-optimistic: chờ server confirm trước, rồi mới cập nhật Redux.
   * Trả về { success: boolean } để caller biết kết quả.
   */
  const resetAllQuizAttempts = useCallback(async () => {
    if (!courseSlug || !lectureId) return { success: false };
    try {
      await learningApi.resetAllQuizzes({ courseSlug, lectureId });
      // ✅ Chỉ dispatch SAU khi server thành công
      dispatch(removeAllQuizzesForLecture({ lectureId }));
      // ✅ FIX: Clear tất cả triggered
      triggeredRef.current.clear();
      toast.success('↺ Đã reset tất cả quiz! Tua video để làm lại từ đầu.', { toastId: 'quiz-reset-all', autoClose: 4000 });
      return { success: true };
    } catch (err) {
      toast.error('Không thể reset tất cả quiz. Vui lòng thử lại.', { toastId: 'quiz-reset-all-err' });
      return { success: false };
    }
  }, [courseSlug, lectureId, dispatch]);


  // ─── reset — gọi khi đổi bài giảng ──────────────────────────────────────────
  const reset = useCallback(() => {
    triggeredRef.current.clear();
    lastKnownTimeRef.current = 0;
    isSeekingRef.current = false;
    pendingRetakeRef.current = null;
  }, []);

  return {
    onTimeUpdate,
    onSeeked,
    checkSeekBlock,
    notifySeekStart,   // ✅ NEW: gọi từ VideoJSPlayer tại handler "seeking"
    notifySeekEnd,     // ✅ NEW: gọi từ VideoJSPlayer tại handler "seeked"
    submitAnswer,
    resetQuizAttempt,
    resetAllQuizAttempts,
    reset,
    activeQuiz,
    quizBlocked,
    isQuizDone,
    completedQuizzes,  // expose để VideoPlayer pass xuống QuizProgressMarkers
    lastKnownTimeRef,  // expose để VideoPlayer dùng trong handleSeeking
    pendingRetakeRef,  // ✅ NEW: expose để handleRetakeQuiz set giá trị
  };
}
