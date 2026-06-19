// client/src/features/learning/useVideoQuiz.js
import { useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showQuiz, markQuizComplete, removeQuizComplete, removeAllQuizzesForLecture } from './learningSlice';
import { learningApi } from '../../api/learningApi';
import { toast } from 'react-toastify';

/**
 * Hook quản lý toàn bộ logic Interactive Video Quiz cho VideoPlayer (web)
 *
 * ✅ FIX v2:
 *   - checkSeekBlock giờ nhận currentTimeBefore → chỉ chặn FORWARD seek
 *   - lastKnownTimeRef theo dõi vị trí trước khi seek
 *   - triggeredRef được xóa khi quiz reset (retake)
 *   - Thêm resetQuizAttempt / resetAllQuizAttempts cho Retake feature
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

  // ✅ FIX: Lưu vị trí video TRƯỚC khi seek để phân biệt forward/backward
  const lastKnownTimeRef = useRef(0);

  // ─── Kiểm tra quiz đã hoàn thành ĐÚNG (so sánh với state từ server) ────────
  const isQuizDone = useCallback((quizIndex) => {
    if (!lectureId) return false;
    return completedQuizzes.some(
      q => String(q.lectureId) === String(lectureId)
        && q.quizIndex === quizIndex
        && q.isCorrect !== false // backward-compat: entries cũ không có isCorrect → xem như đúng
    );
  }, [completedQuizzes, lectureId]);

  // ─── onTimeUpdate — gắn vào video element ────────────────────────────────────
  /**
   * Gọi từ onTimeUpdate event của video.
   * Cửa sổ trigger: [timestamp, timestamp + 2.5] giây.
   * ✅ FIX: Chỉ cập nhật lastKnownTimeRef khi phát bình thường (không nhảy forward > 1.5s) hoặc tua ngược.
   */
  const onTimeUpdate = useCallback((currentTimeSec) => {
    const diff = currentTimeSec - lastKnownTimeRef.current;
    const isNormalProgression = (diff > 0 && diff < 1.5) || diff < 0;

    if (isNormalProgression) {
      lastKnownTimeRef.current = currentTimeSec;
    }

    if (quizBlocked || !quizzes.length) return;

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
  const onSeeked = useCallback((currentTimeSec) => {
    lastKnownTimeRef.current = currentTimeSec;
  }, []);

  // ─── checkSeekBlock — gọi từ onSeeking event ─────────────────────────────────
  /**
   * ✅ FIX v2: Nhận thêm currentTimeBefore — chỉ chặn FORWARD seek
   * Nếu user tua NGƯỢC (backward) thì KHÔNG bao giờ chặn.
   *
   * @param {number} seekToSec        - giây user muốn tua đến
   * @param {number} [currentTimeBefore] - giây trước khi seek (từ lastKnownTimeRef)
   * @returns {{ blocked: boolean, revertTo: number|null, blockedQuiz: object|null }}
   */
  const checkSeekBlock = useCallback((seekToSec, currentTimeBefore) => {
    if (!quizzes.length) return { blocked: false, revertTo: null, blockedQuiz: null };

    // Nếu không truyền currentTimeBefore, dùng lastKnownTimeRef
    const beforeTime = currentTimeBefore ?? lastKnownTimeRef.current;

    // ✅ FIX: Chỉ chặn FORWARD seek (seekTo > beforeTime)
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

  // ─── resetQuizAttempt — reset 1 quiz để làm lại ──────────────────────────────
  const resetQuizAttempt = useCallback(async (quizIndex) => {
    if (!courseSlug || !lectureId) return;
    try {
      await learningApi.resetQuiz({ courseSlug, lectureId, quizIndex });
      dispatch(removeQuizComplete({ lectureId, quizIndex }));
      // ✅ FIX: Xóa khỏi triggeredRef để quiz có thể trigger lại
      triggeredRef.current.delete(quizIndex);
      toast.success('Đã reset quiz. Bạn có thể làm lại!', { toastId: 'quiz-reset' });
    } catch (err) {
      toast.error('Không thể reset quiz', { toastId: 'quiz-reset-err' });
    }
  }, [courseSlug, lectureId, dispatch]);

  // ─── resetAllQuizAttempts — reset toàn bộ quiz của lecture ────────────────────
  const resetAllQuizAttempts = useCallback(async () => {
    if (!courseSlug || !lectureId) return;
    try {
      await learningApi.resetAllQuizzes({ courseSlug, lectureId });
      dispatch(removeAllQuizzesForLecture({ lectureId }));
      // ✅ FIX: Clear tất cả triggered
      triggeredRef.current.clear();
      toast.success('Đã reset tất cả quiz trong bài giảng!', { toastId: 'quiz-reset-all' });
    } catch (err) {
      toast.error('Không thể reset quiz', { toastId: 'quiz-reset-all-err' });
    }
  }, [courseSlug, lectureId, dispatch]);

  // ─── reset — gọi khi đổi bài giảng ──────────────────────────────────────────
  const reset = useCallback(() => {
    triggeredRef.current.clear();
    lastKnownTimeRef.current = 0;
  }, []);

  return {
    onTimeUpdate,
    onSeeked,
    checkSeekBlock,
    submitAnswer,
    resetQuizAttempt,
    resetAllQuizAttempts,
    reset,
    activeQuiz,
    quizBlocked,
    isQuizDone,
    completedQuizzes, // expose để VideoPlayer pass xuống QuizProgressMarkers
    lastKnownTimeRef, // expose để VideoPlayer dùng trong handleSeeking
  };
}
