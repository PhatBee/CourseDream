// client/src/components/learning/VideoQuizOverlay.jsx
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb, HelpCircle, Loader2 } from 'lucide-react';

/**
 * VideoQuizOverlay — hiển thị overlay quiz chặn video
 *
 * Props:
 *   quiz      - object quiz { question, options: [{id, text}], hint }
 *   onSubmit  - async fn(answer) → { correct, hint }
 *   onCorrect - fn() gọi sau khi đúng (resume video)
 */
const VideoQuizOverlay = ({ quiz, onSubmit, onCorrect }) => {
  const [selected, setSelected]       = useState(null);
  const [feedback, setFeedback]       = useState(null); // null | 'correct' | 'wrong'
  const [hint, setHint]               = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleSelect = (id) => {
    if (feedback === 'correct' || isSubmitting) return;
    setSelected(id);
    setFeedback(null);
    setHint(null);
  };

  const handleSubmit = async () => {
    if (!selected || isSubmitting || feedback === 'correct') return;
    setSubmitting(true);
    setAttemptCount(prev => prev + 1);

    const result = await onSubmit(selected);

    if (result.correct) {
      setFeedback('correct');
      // Đóng overlay sau 1.3s để user thấy feedback
      setTimeout(() => onCorrect(), 1300);
    } else {
      setFeedback('wrong');
      setHint(result.hint);
      setSelected(null); // Reset lựa chọn để chọn lại
    }
    setSubmitting(false);
  };

  return (
    // Backdrop — ngăn user thấy video bên dưới
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ animation: 'fadeSlideIn 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <HelpCircle size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Câu hỏi kiểm tra</p>
            <p className="text-rose-200 text-xs">Trả lời đúng để tiếp tục xem video</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Question */}
          <h3 className="text-base font-bold text-gray-900 mb-4 leading-snug">
            {quiz.question}
          </h3>

          {/* Options */}
          <div className="space-y-2.5 mb-5">
            {(quiz.options || []).map((opt) => {
              const isSelected = selected === opt.id;
              const isWrong    = feedback === 'wrong' && isSelected;

              let cls = 'border-gray-200 bg-gray-50 text-gray-700 hover:border-rose-300 hover:bg-rose-50/50';
              if (isWrong)    cls = 'border-red-400 bg-red-50 text-red-700 shake';
              else if (isSelected) cls = 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm';

              return (
                <button
                  key={opt.id}
                  disabled={feedback === 'correct'}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all text-sm flex items-center gap-3 ${cls}`}
                >
                  {/* Option letter badge */}
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 transition-all
                      ${isSelected
                        ? 'bg-rose-500 border-rose-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                      }`}
                  >
                    {opt.id}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Hint */}
          {hint && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <Lightbulb size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 leading-relaxed">{hint}</p>
            </div>
          )}

          {/* Feedback: Correct */}
          {feedback === 'correct' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
              <CheckCircle2 size={17} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-emerald-700">
                Chính xác! Video sẽ tiếp tục phát...
              </p>
            </div>
          )}

          {/* Feedback: Wrong (no hint) */}
          {feedback === 'wrong' && !hint && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <XCircle size={17} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-700">Chưa đúng rồi, hãy thử lại!</p>
                {attemptCount > 1 && (
                  <p className="text-xs text-red-400 mt-0.5">Lần thử thứ {attemptCount}</p>
                )}
              </div>
            </div>
          )}

          {/* Feedback: Wrong (with hint) — show attempt count */}
          {feedback === 'wrong' && hint && attemptCount > 1 && (
            <p className="text-xs text-gray-400 mb-2 text-center">Lần thử thứ {attemptCount}</p>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selected || feedback === 'correct' || isSubmitting}
            className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl
                       hover:bg-rose-700 active:bg-rose-800
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all shadow-sm shadow-rose-200 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Đang kiểm tra...' : 'Xác nhận đáp án'}
          </button>

          {/* ✅ Manual Continue Button — backup khi setTimeout không trigger */}
          {feedback === 'correct' && (
            <button
              onClick={onCorrect}
              className="w-full py-2.5 mt-2 bg-emerald-600 text-white font-semibold rounded-xl
                         hover:bg-emerald-700 transition-all text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={15} />
              Tiếp tục xem video
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .shake {
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-6px); }
          75%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};

export default VideoQuizOverlay;
