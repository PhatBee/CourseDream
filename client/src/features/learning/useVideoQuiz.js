// client/src/features/learning/useVideoQuiz.js
import { useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showQuiz, markQuizComplete } from './learningSlice';
import { learningApi } from '../../api/learningApi';
import { toast } from 'react-toastify';

/**
 * Hook quản lý toàn bộ logic Interactive Video Quiz cho VideoPlayer (web)
 *
 * @param {string} courseSlug
 * @param {string} lectureId
 * @param {Array}  quizzes     - Mảng quiz của lecture hiện tại (từ currentLecture.quizzes)
 *
 * Cách dùng trong VideoPlayer:
 *   const { onTimeUpdate, checkSeekBlock, submitAnswer, activeQuiz, quizBlocked } =
 *     useVideoQuiz(courseSlug, currentLecture._id, currentLecture.quizzes || []);
 *
 *   // Gắn vào <video>:
 *   <video onTimeUpdate={() => onTimeUpdate(videoRef.current.currentTime)}
 *          onSeeking={handleSeeking} ... />
 */
export function useVideoQuiz(courseSlug, lectureId, quizzes = []) {
  const dispatch = useDispatch();
  const { completedQuizzes, activeQuiz, quizBlocked } = useSelector(s => s.learning);

  // Set lưu quizIndex đã TRIGGER trong session này (tránh re-trigger sau khi resume)
  const triggeredRef = useRef(new Set());

  // ─── Kiểm tra quiz đã hoàn thành (so sánh với state từ server) ──────────────
  const isQuizDone = useCallback((quizIndex) => {
    if (!lectureId) return false;
    return completedQuizzes.some(
      q => String(q.lectureId) === String(lectureId) && q.quizIndex === quizIndex
    );
  }, [completedQuizzes, lectureId]);

  // ─── onTimeUpdate — gắn vào video element ────────────────────────────────────
  /**
   * Gọi từ onTimeUpdate event của video.
   * Cửa sổ trigger: [timestamp, timestamp + 2.5] giây.
   */
  const onTimeUpdate = useCallback((currentTimeSec) => {
    if (quizBlocked || !quizzes.length) return;

    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i];
      if (!quiz.isActive) continue;

      const ts = Number(quiz.timestamp);
      const inWindow = currentTimeSec >= ts && currentTimeSec <= ts + 2.5;

      if (inWindow && !isQuizDone(i) && !triggeredRef.current.has(i)) {
        triggeredRef.current.add(i);
        dispatch(showQuiz({ quizIndex: i, quiz }));
        return; // Chỉ show 1 quiz tại 1 thời điểm
      }
    }
  }, [quizzes, quizBlocked, isQuizDone, dispatch]);

  // ─── checkSeekBlock — gọi từ onSeeking event ─────────────────────────────────
  /**
   * Kiểm tra nếu user tua video vượt qua mốc quiz chưa làm.
   * @param {number} seekToSec - giây user muốn tua đến
   * @returns {{ blocked: boolean, revertTo: number|null }}
   */
  const checkSeekBlock = useCallback((seekToSec) => {
    if (!quizzes.length) return { blocked: false, revertTo: null };

    // Sắp xếp theo timestamp tăng dần
    const sortedQuizzes = [...quizzes]
      .map((q, i) => ({ ...q, index: i }))
      .filter(q => q.isActive !== false)
      .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

    for (const quiz of sortedQuizzes) {
      const ts = Number(quiz.timestamp);
      if (!isQuizDone(quiz.index) && seekToSec > ts) {
        return {
          blocked: true,
          revertTo: Math.max(0, ts - 2), // Revert về 2s trước mốc quiz
        };
      }
    }
    return { blocked: false, revertTo: null };
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
        dispatch(markQuizComplete({ lectureId, quizIndex }));
      }
      return { correct, hint: hint || null };
    } catch (err) {
      toast.error('Lỗi kết nối, thử lại sau!', { toastId: 'quiz-err' });
      return { correct: false, hint: null };
    }
  }, [courseSlug, lectureId, dispatch]);

  // ─── reset — gọi khi đổi bài giảng ──────────────────────────────────────────
  const reset = useCallback(() => {
    triggeredRef.current.clear();
  }, []);

  return {
    onTimeUpdate,
    checkSeekBlock,
    submitAnswer,
    reset,
    activeQuiz,
    quizBlocked,
    isQuizDone,
    completedQuizzes, // expose để VideoPlayer pass xuống QuizProgressMarkers
  };
}
