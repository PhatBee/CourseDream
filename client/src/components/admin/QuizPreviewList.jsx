// client/src/components/admin/QuizPreviewList.jsx
import React, { useState } from 'react';
import { HelpCircle, Clock, ChevronDown, ChevronUp, CheckCircle2, Trophy } from 'lucide-react';

/**
 * formatTimestamp — chuyển giây → "mm:ss"
 */
const formatTs = (sec) => {
  const s = Math.floor(Number(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * OPTION_LABELS — ánh xạ index → chữ cái
 */
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

/**
 * QuizCard — hiển thị một câu hỏi quiz
 */
const QuizCard = ({ quiz, index, total }) => {
  const [expanded, setExpanded] = useState(true);

  // Normalize options: hỗ trợ cả dạng string[] và [{id, text}]
  const options = (quiz.options || []).map((opt, i) => {
    if (typeof opt === 'string') return { id: OPTION_LABELS[i] || String(i + 1), text: opt };
    return { id: opt.id || OPTION_LABELS[i], text: opt.text || String(opt) };
  });

  // correctIndex có thể là số (0-based) hoặc chữ cái ('A','B',...)
  const getCorrectLabel = () => {
    const ci = quiz.correctAnswer;
    if (typeof ci === 'number') return OPTION_LABELS[ci] || String(ci);
    return String(ci);
  };
  const correctLabel = getCorrectLabel();

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:border-rose-100 hover:shadow-md"
    >
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-gray-50/60 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Quiz số thứ tự badge */}
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-violet-600">{index + 1}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
              {quiz.question || 'Câu hỏi chưa có nội dung'}
            </p>

            {/* Meta: timestamp + số đáp án */}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {quiz.timestamp != null && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={10} className="flex-shrink-0" />
                  Tại <strong className="text-gray-600 font-semibold">{formatTs(quiz.timestamp)}</strong>
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <HelpCircle size={10} className="flex-shrink-0" />
                {options.length} đáp án
              </span>
              {/* Badge đáp án đúng — preview nhanh ngay trên header */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                <CheckCircle2 size={9} />
                Đáp án: {correctLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Expand/Collapse icon */}
        <div className="flex-shrink-0 ml-3">
          {expanded
            ? <ChevronUp size={15} className="text-gray-400" />
            : <ChevronDown size={15} className="text-gray-400" />
          }
        </div>
      </button>

      {/* Card Body — Options List */}
      {expanded && (
        <div className="px-3.5 pb-4 pt-1 border-t border-gray-50">
          <div className="space-y-2 mt-2">
            {options.map((opt, i) => {
              const isCorrect = opt.id === correctLabel || i === (typeof quiz.correctIndex === 'number' ? quiz.correctIndex : -1);

              return (
                <div
                  key={opt.id || i}
                  className={`
                    flex items-start gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-justify
                    ${isCorrect
                      ? 'bg-emerald-50 border-emerald-300 shadow-sm shadow-emerald-100'
                      : 'bg-gray-50 border-gray-100 text-gray-600'
                    }
                  `}
                >
                  {/* Option label badge */}
                  <span
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border-2
                      ${isCorrect
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                      }
                    `}
                  >
                    {opt.id}
                  </span>

                  {/* Option text */}
                  <span
                    className={`text-sm leading-relaxed flex-1 ${isCorrect ? 'text-emerald-800 font-semibold' : 'text-gray-600'
                      }`}
                  >
                    {opt.text}
                  </span>

                  {/* Correct indicator */}
                  {isCorrect && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <CheckCircle2 size={15} className="text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600">Đúng</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hint section (nếu có) */}
          {quiz.hint && (
            <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-base flex-shrink-0">💡</span>
              <p className="text-xs text-amber-800 leading-relaxed">{quiz.hint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * QuizPreviewList
 *
 * Hiển thị danh sách câu hỏi quiz của một bài giảng trong trang Admin kiểm duyệt.
 *
 * Props:
 *   quizzes - mảng quiz objects [{ question, options, correctIndex, timestamp, hint }]
 */
const QuizPreviewList = ({ quizzes = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!quizzes || quizzes.length === 0) return null;

  // Chỉ đếm quiz đang active
  const activeQuizzes = quizzes.filter(q => q.isActive !== false);
  if (activeQuizzes.length === 0) return null;

  return (
    <div className="mt-3 ml-9">
      {/* Toggle button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold
          transition-all border-2 group
          ${isOpen
            ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200'
            : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 hover:border-violet-300'
          }
        `}
      >
        <Trophy size={12} />
        {activeQuizzes.length} câu hỏi Quiz
        {isOpen
          ? <ChevronUp size={11} />
          : <ChevronDown size={11} />
        }
      </button>

      {/* Quiz list (expandable) */}
      {isOpen && (
        <div className="mt-2 space-y-2.5 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-violet-100" />
            <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">
              Danh sách câu hỏi kiểm tra
            </span>
            <div className="h-px flex-1 bg-violet-100" />
          </div>

          {activeQuizzes.map((quiz, idx) => (
            <QuizCard
              key={quiz._id || idx}
              quiz={quiz}
              index={idx}
              total={activeQuizzes.length}
            />
          ))}

          {/* Footer summary */}
          <div className="flex items-center gap-2 p-2.5 bg-violet-50 rounded-xl border border-violet-100">
            <Trophy size={13} className="text-violet-500 flex-shrink-0" />
            <p className="text-xs text-violet-700">
              <strong>{activeQuizzes.length}</strong> câu hỏi trắc nghiệm tương tác tại các mốc thời gian trong video
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPreviewList;
