// client/src/components/learning/QuizReviewModal.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X, CheckCircle2, XCircle, RotateCcw, Lightbulb,
  Clock, ChevronDown, ChevronUp, HelpCircle, Loader2,
} from 'lucide-react';
import { fetchQuizReview, removeQuizComplete, removeAllQuizzesForLecture } from '../../features/learning/learningSlice';
import { learningApi } from '../../api/learningApi';
import { toast } from 'react-toastify';

// ─── formatTimestamp helper ───────────────────────────────────────────────────
const fmt = (sec) => {
  const s = Math.floor(Number(sec) || 0);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

// ─── QuizReviewItem — một dòng quiz trong panel ───────────────────────────────
const QuizReviewItem = ({ item, onRetake, isResetting }) => {
  const [expanded, setExpanded] = useState(false);
  const hasAttempt = Boolean(item.attempt);

  // Badge trạng thái
  let statusEl;
  if (!hasAttempt) {
    statusEl = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
        <HelpCircle size={10} /> Chưa làm
      </span>
    );
  } else if (item.attempt.isCorrect) {
    statusEl = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
        <CheckCircle2 size={10} /> Đúng · {item.attempt.attempts} lần thử
      </span>
    );
  } else {
    statusEl = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
        <XCircle size={10} /> Sai
      </span>
    );
  }

  return (
    <div className="px-5 py-4 hover:bg-gray-50/70 transition-colors">
      {/* Header row */}
      <div className="flex items-start gap-2.5 mb-2">
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          {!hasAttempt ? (
            <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center">
              <span className="text-amber-600 text-[9px] font-black">?</span>
            </div>
          ) : item.attempt.isCorrect ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <XCircle size={18} className="text-red-400" />
          )}
        </div>
        {/* Question text */}
        <p className="flex-1 text-sm font-semibold text-gray-800 leading-snug">
          {item.question}
        </p>
        {/* Timestamp */}
        <span className="flex-shrink-0 flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
          <Clock size={9} /> {fmt(item.timestamp)}
        </span>
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-between gap-2 mt-1.5">
        {statusEl}

        {/* Toggle detail button */}
        {hasAttempt && (
          <button
            onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
          </button>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && hasAttempt && (
        <div className="mt-3 space-y-1.5 animate-fadeIn">
          {/* Options với highlight */}
          {(item.options || []).map(opt => {
            const isSelected = opt.id === item.attempt.selectedAnswer;
            const isCorrect  = opt.id === item.correctAnswer;

            let cls = 'border-gray-200 bg-gray-50/50 text-gray-600';
            let suffix = null;
            if (isCorrect) {
              cls    = 'border-emerald-400 bg-emerald-50 text-emerald-800';
              suffix = <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />;
            } else if (isSelected && !isCorrect) {
              cls    = 'border-red-400 bg-red-50 text-red-700';
              suffix = <XCircle size={13} className="text-red-500 flex-shrink-0" />;
            }

            return (
              <div
                key={opt.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${cls}`}
              >
                <span className="font-bold flex-shrink-0">{opt.id}.</span>
                <span className="flex-1">{opt.text}</span>
                {suffix}
              </div>
            );
          })}

          {/* Explanation */}
          {item.explanation && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
              <Lightbulb size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">{item.explanation}</p>
            </div>
          )}

          {/* Hint (khi đã làm và có gợi ý) */}
          {item.hint && !item.attempt.isCorrect && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-blue-500 text-xs flex-shrink-0 mt-0.5">💡</span>
              <p className="text-xs text-blue-800 leading-relaxed">{item.hint}</p>
            </div>
          )}
        </div>
      )}

      {/* Retake button — chỉ hiện khi đã làm */}
      {hasAttempt && (
        <button
          onClick={onRetake}
          disabled={isResetting}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResetting
            ? <Loader2 size={11} className="animate-spin" />
            : <RotateCcw size={11} />
          }
          {isResetting ? 'Đang reset...' : 'Làm lại câu này'}
        </button>
      )}
    </div>
  );
};

// ─── QuizReviewModal — Panel chính ────────────────────────────────────────────
/**
 * QuizReviewModal
 *
 * Một side-panel trượt từ phải, không chặn video phía sau.
 * Video vẫn phát bình thường trong khi panel mở.
 *
 * Props:
 *   isOpen      - boolean
 *   onClose     - fn()
 *   courseSlug  - string
 *   lectureId   - string
 *   quizzes     - mảng quiz gốc (để đếm số lượng)
 *   onRetake    - fn(quizIndex) — callback sau khi reset 1 quiz (để tua video)
 *   onRetakeAll - fn() — callback sau khi reset tất cả quiz
 */
const QuizReviewModal = ({
  isOpen,
  onClose,
  courseSlug,
  lectureId,
  quizzes = [],
  onRetake,
  onRetakeAll,
}) => {
  const dispatch = useDispatch();
  const { quizReviewData, isLoadingReview } = useSelector(s => s.learning);
  const [resettingIndex, setResettingIndex] = useState(null);
  const [isResettingAll, setIsResettingAll] = useState(false);

  // Fetch review data khi mở modal
  useEffect(() => {
    if (isOpen && courseSlug && lectureId) {
      dispatch(fetchQuizReview({ courseSlug, lectureId }));
    }
  }, [isOpen, courseSlug, lectureId, dispatch]);

  // Reset 1 quiz (non-optimistic — chờ server confirm trước)
  const handleRetakeOne = useCallback(async (quizIndex) => {
    if (resettingIndex !== null || isResettingAll) return;
    setResettingIndex(quizIndex);
    try {
      await learningApi.resetQuiz({ courseSlug, lectureId, quizIndex });
      dispatch(removeQuizComplete({ lectureId, quizIndex }));
      toast.success('↺ Đã reset! Tua video về vị trí câu hỏi để làm lại.', {
        toastId: 'quiz-retake',
        autoClose: 4000,
      });
      onRetake?.(quizIndex);
      onClose();
    } catch {
      toast.error('Không thể reset quiz. Vui lòng thử lại.', { toastId: 'quiz-retake-err' });
    } finally {
      setResettingIndex(null);
    }
  }, [courseSlug, lectureId, dispatch, onRetake, onClose, resettingIndex, isResettingAll]);

  // Reset tất cả quiz của lecture (non-optimistic)
  const handleRetakeAll = useCallback(async () => {
    if (resettingIndex !== null || isResettingAll) return;
    setIsResettingAll(true);
    try {
      await learningApi.resetAllQuizzes({ courseSlug, lectureId });
      dispatch(removeAllQuizzesForLecture({ lectureId }));
      toast.success('↺ Đã reset tất cả quiz! Tua video để làm lại từ đầu.', {
        toastId: 'quiz-retake-all',
        autoClose: 4000,
      });
      onRetakeAll?.();
      onClose();
    } catch {
      toast.error('Không thể reset tất cả quiz. Vui lòng thử lại.', { toastId: 'quiz-retake-all-err' });
    } finally {
      setIsResettingAll(false);
    }
  }, [courseSlug, lectureId, dispatch, onRetakeAll, onClose, resettingIndex, isResettingAll]);

  // Đếm số quiz đã làm
  const doneCount = quizReviewData.filter(q => q.attempt !== null).length;
  const activeQuizzes = quizzes.filter(q => q.isActive !== false);

  if (!isOpen) return null;

  return (
    // Wrapper dùng pointer-events: none để không chặn video phía sau
    <div
      className="fixed inset-0 z-[300]"
      style={{ pointerEvents: 'none' }}
    >
      {/* Overlay mờ nhẹ phía trái (chỉ để visual, không chặn click) */}
      <div
        className="absolute inset-0 bg-black/10"
        style={{ pointerEvents: 'auto' }}
        onClick={onClose}
      />

      {/* Side panel — chỉ panel có pointer-events */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl flex flex-col"
        style={{
          pointerEvents: 'auto',
          animation: 'quizReviewSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-[15px] flex items-center gap-2">
              📋 Xem lại câu hỏi
            </h2>
            <p className="text-indigo-200 text-xs mt-0.5">
              {doneCount}/{activeQuizzes.length} câu đã hoàn thành
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Retake All button */}
            <button
              onClick={handleRetakeAll}
              disabled={isResettingAll || doneCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isResettingAll
                ? <Loader2 size={11} className="animate-spin" />
                : <RotateCcw size={11} />
              }
              Làm lại tất cả
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              aria-label="Đóng"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {isLoadingReview ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
              <p className="text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : quizReviewData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2 px-6 text-center">
              <HelpCircle size={32} className="text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Bài giảng này chưa có câu hỏi quiz</p>
            </div>
          ) : (
            quizReviewData
              .filter(q => q.isActive !== false)
              .map((item, idx) => (
                <QuizReviewItem
                  key={idx}
                  item={item}
                  onRetake={() => handleRetakeOne(item.quizIndex)}
                  isResetting={resettingIndex === item.quizIndex}
                />
              ))
          )}
        </div>

        {/* ── Footer tip ── */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <p className="text-[11px] text-gray-400 leading-snug">
            💡 Sau khi reset, tua video về đúng mốc thời gian của câu hỏi để làm lại.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes quizReviewSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default QuizReviewModal;
