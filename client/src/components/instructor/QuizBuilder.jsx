// client/src/components/instructor/QuizBuilder.jsx
import React, { useState, useCallback } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  Clock, CheckCircle2, AlertCircle, HelpCircle, GripVertical
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatTimestamp = (seconds) => {
  if (!seconds && seconds !== 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const ANSWER_OPTIONS = ['A', 'B', 'C', 'D'];

const EMPTY_QUIZ = () => ({
  question: '',
  options: [
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ],
  correctAnswer: 'A',
  hint: '',
  timestamp: 0,
  isActive: true,
});

// ─── QuizCard — hiển thị / chỉnh sửa một quiz ───────────────────────────────
const QuizCard = ({ quiz, index, onChange, onDelete, onGetCurrentTime }) => {
  const [expanded, setExpanded] = useState(true);

  const update = (field, value) => onChange({ ...quiz, [field]: value });

  const updateOption = (id, text) => {
    const options = quiz.options.map(o => o.id === id ? { ...o, text } : o);
    onChange({ ...quiz, options });
  };

  const isValid = quiz.question.trim() &&
    quiz.options.every(o => o.text.trim()) &&
    ANSWER_OPTIONS.includes(quiz.correctAnswer);

  return (
    <div className={`border rounded-xl overflow-hidden shadow-sm transition-all ${isValid ? 'border-gray-200' : 'border-amber-300'}`}>
      {/* Card Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
          <div className="flex items-center gap-1.5 bg-rose-100 text-rose-700 rounded-full px-2.5 py-0.5 text-xs font-bold flex-shrink-0">
            <Clock size={11} />
            {formatTimestamp(quiz.timestamp)}
          </div>
          <p className="text-sm font-medium text-gray-800 truncate">
            {quiz.question || <span className="text-gray-400 italic">Chưa nhập câu hỏi...</span>}
          </p>
          {!isValid && (
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa quiz"
          >
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <div className="p-4 space-y-4 bg-white">
          {/* Timestamp row */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                Mốc thời gian (giây)
              </label>
              <input
                type="number"
                min="0"
                value={quiz.timestamp}
                onChange={e => update('timestamp', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="0"
              />
            </div>
            <div className="flex-shrink-0 mt-5">
              <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 rounded-lg px-3 py-2 text-sm font-semibold">
                <Clock size={14} />
                {formatTimestamp(quiz.timestamp)}
              </span>
            </div>
            {onGetCurrentTime && (
              <button
                type="button"
                onClick={() => {
                  const t = onGetCurrentTime();
                  if (t !== null) update('timestamp', Math.floor(t));
                }}
                className="flex-shrink-0 mt-5 px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 whitespace-nowrap"
                title="Lấy vị trí hiện tại của video"
              >
                📍 Vị trí hiện tại
              </button>
            )}
          </div>

          {/* Question */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Câu hỏi <span className="text-red-400">*</span>
            </label>
            <textarea
              value={quiz.question}
              onChange={e => update('question', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
              placeholder="Nhập câu hỏi trắc nghiệm..."
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Các lựa chọn <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              {quiz.options.map(opt => (
                <div key={opt.id} className="flex items-center gap-2">
                  {/* Correct answer radio */}
                  <button
                    type="button"
                    onClick={() => update('correctAnswer', opt.id)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 transition-all
                      ${quiz.correctAnswer === opt.id
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                        : 'bg-white border-gray-300 text-gray-400 hover:border-emerald-400'
                      }`}
                    title={`Đặt ${opt.id} là đáp án đúng`}
                  >
                    {opt.id}
                  </button>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={e => updateOption(opt.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                    placeholder={`Lựa chọn ${opt.id}...`}
                  />
                  {quiz.correctAnswer === opt.id && (
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              💡 Bấm vào ký tự (A/B/C/D) bên trái để chọn đáp án đúng
            </p>
          </div>

          {/* Hint */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1">
              <HelpCircle size={11} /> Gợi ý khi sai (tuỳ chọn)
            </label>
            <input
              type="text"
              value={quiz.hint}
              onChange={e => update('hint', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="Gợi ý hiển thị khi học viên trả lời sai..."
            />
          </div>

          {/* isActive toggle */}
          <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={quiz.isActive}
                onChange={e => update('isActive', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${quiz.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5 ${quiz.isActive ? 'translate-x-5' : ''}`} />
              </div>
            </label>
            <span className="text-sm text-gray-600">
              {quiz.isActive ? 'Đang kích hoạt' : 'Đã tắt (học viên không thấy)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── QuizBuilder — component chính ────────────────────────────────────────────
/**
 * Props:
 *   quizzes      - array quiz hiện tại
 *   onChange     - fn(newQuizzes) khi danh sách thay đổi
 *   getPlayerTime - fn() → number|null (lấy currentTime từ video đang phát)
 */
const QuizBuilder = ({ quizzes = [], onChange, getPlayerTime }) => {
  const handleAdd = () => {
    onChange([...quizzes, EMPTY_QUIZ()]);
  };

  const handleChange = useCallback((index, updatedQuiz) => {
    const next = quizzes.map((q, i) => i === index ? updatedQuiz : q);
    onChange(next);
  }, [quizzes, onChange]);

  const handleDelete = useCallback((index) => {
    onChange(quizzes.filter((_, i) => i !== index));
  }, [quizzes, onChange]);

  const activeCount = quizzes.filter(q => q.isActive).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-800">
            Câu hỏi tương tác ({quizzes.length})
          </h4>
          {quizzes.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {activeCount} câu đang kích hoạt
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-2 px-3 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          Thêm câu hỏi
        </button>
      </div>

      {/* Empty state */}
      {quizzes.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center text-center">
          <HelpCircle size={28} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 font-medium">Chưa có câu hỏi nào</p>
          <p className="text-xs text-gray-300 mt-1">
            Thêm câu hỏi để kiểm tra học viên tại các mốc trong video
          </p>
        </div>
      )}

      {/* Quiz list */}
      <div className="space-y-3">
        {quizzes.map((quiz, i) => (
          <QuizCard
            key={i}
            quiz={quiz}
            index={i}
            onChange={(updated) => handleChange(i, updated)}
            onDelete={() => handleDelete(i)}
            onGetCurrentTime={getPlayerTime}
          />
        ))}
      </div>

      {/* Info note */}
      {quizzes.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
          <strong>Lưu ý:</strong> Đáp án đúng chỉ được kiểm tra phía server — học viên không thể xem trộm đáp án qua developer tools.
          Quiz sẽ được lưu vào revision và Admin sẽ kiểm duyệt trước khi xuất bản.
        </div>
      )}
    </div>
  );
};

export default QuizBuilder;
