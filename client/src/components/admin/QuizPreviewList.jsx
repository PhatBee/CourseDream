// client/src/components/admin/QuizPreviewList.jsx
import React, { useState, useMemo } from 'react';
import {
  HelpCircle, Clock, ChevronDown, ChevronUp, CheckCircle2,
  Trophy, Sparkles, Trash2, AlertTriangle, Edit3
} from 'lucide-react';

// ========================================================================================
// ── HELPERS ───────────────────────────────────────────────────────────────────────────
// ========================================================================================

/** Chuyển giây → "mm:ss" */
const formatTs = (sec) => {
  const s = Math.floor(Number(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

/** Ánh xạ index → chữ cái đáp án */
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

/**
 * normalizeOptions — chuẩn hóa mảng options thành dạng [{ id, text }]
 * Hỗ trợ cả string[] và [{id, text}].
 */
const normalizeOptions = (options = []) =>
  options.map((opt, i) => {
    if (typeof opt === 'string') return { id: OPTION_LABELS[i] || String(i + 1), text: opt };
    return { id: opt.id || OPTION_LABELS[i], text: opt.text || String(opt) };
  });

/**
 * getCorrectLabel — trả về chữ cái đáp án đúng từ correctAnswer.
 * correctAnswer có thể là: số 0-based, hoặc chữ cái 'A'/'B'/...
 */
const getCorrectLabel = (quiz) => {
  const ci = quiz.correctAnswer;
  if (typeof ci === 'number') return OPTION_LABELS[ci] || String(ci);
  return String(ci);
};

// ========================================================================================
// ── DIFF HELPERS ──────────────────────────────────────────────────────────────────────
// Tính diff quiz list: khớp theo `question` text.
// Returns: annotated array (revision quizzes + deleted quizzes từ original)
// ========================================================================================

/**
 * annotateQuizzesDiff
 * @param {Array} origQuizzes  — quizzes từ originalCourse lecture
 * @param {Array} revQuizzes   — quizzes từ revision lecture
 * @returns {Array} Mảng quiz đã được annotated với `_diffStatus` và `_original`
 */
const annotateQuizzesDiff = (origQuizzes = [], revQuizzes = []) => {
  // Build map từ original (key = question text đã trim)
  const origMap = new Map();
  origQuizzes.forEach(q => {
    const key = (q.question || '').trim();
    if (key) origMap.set(key, q);
  });

  const usedKeys = new Set();

  // Annotate revision quizzes
  const annotatedRev = revQuizzes.map(q => {
    const key = (q.question || '').trim();
    const origQ = origMap.get(key);
    usedKeys.add(key);

    if (!origQ) {
      // Câu hỏi mới xuất hiện trong revision
      return { ...q, _diffStatus: 'added', _original: null };
    }

    // So sánh chi tiết từng thuộc tính
    const correctAnswerChanged = String(origQ.correctAnswer) !== String(q.correctAnswer);
    const optionsChanged       = JSON.stringify(origQ.options || []) !== JSON.stringify(q.options || []);
    const hintChanged          = (origQ.hint || '').trim() !== (q.hint || '').trim();

    const isModified = correctAnswerChanged || optionsChanged || hintChanged;

    return {
      ...q,
      _diffStatus: isModified ? 'modified' : 'unchanged',
      _original: origQ,
      // Lưu flag chi tiết để render dễ hơn
      _correctAnswerChanged: correctAnswerChanged,
      _optionsChanged: optionsChanged,
    };
  });

  // Thêm các quiz bị xóa (có trong original nhưng không có trong revision)
  const deletedQuizzes = origQuizzes
    .filter(q => {
      const key = (q.question || '').trim();
      return key && !usedKeys.has(key);
    })
    .map(q => ({
      ...q,
      _diffStatus: 'deleted',
      _original: q,
    }));

  return [...annotatedRev, ...deletedQuizzes];
};


// ========================================================================================
// ── QUIZ CARD COMPONENT ───────────────────────────────────────────────────────────────
// ========================================================================================

/**
 * QuizCard — hiển thị một câu hỏi quiz, với diff highlighting khi có _diffStatus.
 *
 * Props:
 *   quiz       - Quiz object (có thể có _diffStatus, _original, _correctAnswerChanged, _optionsChanged)
 *   index      - Số thứ tự (0-based)
 *   total      - Tổng số quiz
 *   isDiffMode - Bật/tắt giao diện diff
 */
const QuizCard = ({ quiz, index, isDiffMode = false }) => {
  const [expanded, setExpanded] = useState(true);

  const diffStatus       = quiz._diffStatus || 'unchanged';
  const originalQuiz     = quiz._original;
  const isDeleted        = diffStatus === 'deleted';
  const isAdded          = diffStatus === 'added';
  const isModified       = diffStatus === 'modified';
  const correctAnswerChanged = quiz._correctAnswerChanged || false;
  const optionsChanged       = quiz._optionsChanged || false;

  // ── Chuẩn hóa options ──────────────────────────────────────────────────────────────
  const options         = normalizeOptions(quiz.options || []);
  const origOptions     = originalQuiz ? normalizeOptions(originalQuiz.options || []) : [];
  const correctLabel    = getCorrectLabel(quiz);
  const origCorrectLabel = originalQuiz ? getCorrectLabel(originalQuiz) : null;

  // ── Card container styling ─────────────────────────────────────────────────────────
  const cardBorderClass = isDiffMode
    ? {
        added:     'border-emerald-300 bg-emerald-50/40 shadow-emerald-100',
        modified:  'border-amber-300 bg-amber-50/40 shadow-amber-100',
        deleted:   'border-red-200 bg-red-50/30 shadow-red-100 opacity-80',
        unchanged: 'border-gray-100 bg-white',
      }[diffStatus]
    : 'border-gray-100 bg-white';

  return (
    <div className={`rounded-xl border-2 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${cardBorderClass}`}>

      {/* ── Diff Status Strip (chỉ khi isDiffMode và có status) ──────────────────── */}
      {isDiffMode && diffStatus !== 'unchanged' && (
        <div className={`px-3.5 py-1.5 flex items-center gap-2 border-b ${
          isAdded    ? 'bg-emerald-100 border-emerald-200' :
          isModified ? 'bg-amber-100 border-amber-200'    :
          isDeleted  ? 'bg-red-100 border-red-200'        : ''
        }`}>
          {isAdded    && <><Sparkles size={11} className="text-emerald-600" /><span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Câu hỏi mới</span></>}
          {isModified && <><Edit3    size={11} className="text-amber-600"   /><span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Có chỉnh sửa</span></>}
          {isDeleted  && <><Trash2   size={11} className="text-red-500"     /><span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Đã xóa khỏi bài học</span></>}

          {/* Cảnh báo nổi bật nếu đáp án đúng bị đổi */}
          {isDiffMode && isModified && correctAnswerChanged && (
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full">
              <AlertTriangle size={9} /> Đáp án đổi: {origCorrectLabel} → {correctLabel}
            </span>
          )}
        </div>
      )}

      {/* ── Card Header (Question + Meta) ─────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-3.5 text-left transition-colors ${isDeleted ? 'cursor-default' : 'hover:bg-gray-50/60'}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Quiz số thứ tự badge */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isAdded    ? 'bg-emerald-100' :
            isModified ? 'bg-amber-100'   :
            isDeleted  ? 'bg-red-100'     :
            'bg-violet-100'
          }`}>
            <span className={`text-xs font-bold ${
              isAdded    ? 'text-emerald-600' :
              isModified ? 'text-amber-600'   :
              isDeleted  ? 'text-red-500'     :
              'text-violet-600'
            }`}>{index + 1}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* ── Question Text với Diff ─────────────────────────────────────────── */}
            <p className={`text-sm font-semibold leading-snug line-clamp-2 ${isDeleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {quiz.question || 'Câu hỏi chưa có nội dung'}
            </p>

            {/* Meta: timestamp + số đáp án + correct answer badge */}
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

              {/* Đáp án đúng — với diff nếu bị đổi */}
              {isDiffMode && isModified && correctAnswerChanged ? (
                // Hiển thị: đáp án cũ gạch ngang đỏ → đáp án mới xanh lá
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-500 text-xs font-bold rounded-full border border-red-200 line-through">
                    <CheckCircle2 size={9} /> {origCorrectLabel}
                  </span>
                  <span className="text-gray-400 text-xs">→</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-300">
                    <CheckCircle2 size={9} /> {correctLabel}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  <CheckCircle2 size={9} />
                  Đáp án: {correctLabel}
                </span>
              )}
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

      {/* ── Card Body — Options List ───────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-3.5 pb-4 pt-1 border-t border-gray-50">

          {/* Nếu options bị thay đổi trong diff mode: Hiển thị bảng so sánh song song */}
          {isDiffMode && isModified && optionsChanged && origOptions.length > 0 ? (
            <>
              {/* Tiêu đề so sánh */}
              <div className="grid grid-cols-2 gap-2 mb-2 mt-2">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Phiên bản cũ</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Phiên bản mới</span>
                </div>
              </div>

              {/* Options cạnh nhau: hàng i so sánh origOptions[i] với options[i] */}
              <div className="space-y-2">
                {Math.max(origOptions.length, options.length) > 0 &&
                  Array.from({ length: Math.max(origOptions.length, options.length) }).map((_, i) => {
                    const origOpt    = origOptions[i];
                    const revOpt     = options[i];
                    const isOrigCorrect = origOpt && origOpt.id === origCorrectLabel;
                    const isRevCorrect  = revOpt  && revOpt.id  === correctLabel;
                    const optionTextChanged = origOpt && revOpt && origOpt.text !== revOpt.text;

                    return (
                      <div key={i} className="grid grid-cols-2 gap-2">
                        {/* Option cũ */}
                        <div className={`flex items-start gap-2 px-2.5 py-2 rounded-xl border transition-all ${
                          isOrigCorrect
                            ? 'bg-red-50/80 border-red-200 shadow-sm'
                            : optionTextChanged
                            ? 'bg-red-50/40 border-red-100'
                            : 'bg-gray-50 border-gray-100'
                        }`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border-2 ${
                            isOrigCorrect ? 'bg-red-400 border-red-400 text-white' : 'bg-white border-gray-300 text-gray-500'
                          }`}>
                            {origOpt?.id || '?'}
                          </span>
                          <span className={`text-xs leading-relaxed ${
                            isOrigCorrect ? 'text-red-700 font-semibold line-through' :
                            optionTextChanged ? 'text-red-500 line-through' :
                            'text-gray-600'
                          }`}>
                            {origOpt?.text || '—'}
                          </span>
                        </div>

                        {/* Option mới */}
                        <div className={`flex items-start gap-2 px-2.5 py-2 rounded-xl border transition-all ${
                          isRevCorrect
                            ? 'bg-emerald-50 border-emerald-300 shadow-sm shadow-emerald-100'
                            : optionTextChanged
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-gray-50 border-gray-100'
                        }`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border-2 ${
                            isRevCorrect
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : optionTextChanged
                              ? 'bg-amber-400 border-amber-400 text-white'
                              : 'bg-white border-gray-300 text-gray-500'
                          }`}>
                            {revOpt?.id || '?'}
                          </span>
                          <span className={`text-xs leading-relaxed ${
                            isRevCorrect    ? 'text-emerald-800 font-semibold' :
                            optionTextChanged ? 'text-amber-700 font-semibold'  :
                            'text-gray-600'
                          }`}>
                            {revOpt?.text || '—'}
                          </span>
                          {isRevCorrect && <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 ml-auto" />}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </>
          ) : (
            // ── Hiển thị options thông thường (không có sự thay đổi options, hoặc không phải diff mode) ──
            <div className="space-y-2 mt-2">
              {options.map((opt, i) => {
                const isCorrect = opt.id === correctLabel ||
                  i === (typeof quiz.correctIndex === 'number' ? quiz.correctIndex : -1);

                return (
                  <div
                    key={opt.id || i}
                    className={`
                      flex items-start gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-justify
                      ${isCorrect
                        ? 'bg-emerald-50 border-emerald-300 shadow-sm shadow-emerald-100'
                        : 'bg-gray-50 border-gray-100 text-gray-600'
                      }
                      ${isDeleted ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Option label badge */}
                    <span className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border-2
                      ${isCorrect
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                      }
                    `}>
                      {opt.id}
                    </span>

                    {/* Option text */}
                    <span className={`text-sm leading-relaxed flex-1 ${isCorrect ? 'text-emerald-800 font-semibold' : 'text-gray-600'} ${isDeleted ? 'line-through' : ''}`}>
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
          )}

          {/* Hint section */}
          {quiz.hint && !isDeleted && (
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


// ========================================================================================
// ── QUIZ PREVIEW LIST COMPONENT ───────────────────────────────────────────────────────
// ========================================================================================

/**
 * QuizPreviewList
 *
 * Hiển thị danh sách câu hỏi quiz của một bài giảng trong trang Admin kiểm duyệt.
 *
 * Props:
 *   quizzes            - Mảng quiz từ revision (bản mới)
 *   originalQuizzes    - Mảng quiz từ originalCourse (bản gốc). Dùng để diff.
 *   isDiffMode         - true = bật visual diff. false = hiển thị bình thường.
 *   showDeletedQuizzes - true = hiển thị cả quiz bị xóa (từ original). Chỉ dùng khi isDiffMode.
 *   isDeletedContext   - true = toàn bộ lecture này bị xóa; quiz hiển thị mờ hơn.
 */
const QuizPreviewList = ({
  quizzes = [],
  originalQuizzes = [],
  isDiffMode = false,
  showDeletedQuizzes = false,
  isDeletedContext = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // ── Tính danh sách quiz để hiển thị ──────────────────────────────────────────────
  // Dùng useMemo để không tính lại trên mỗi re-render nếu props không đổi.
  const displayQuizzes = useMemo(() => {
    if (isDiffMode && (originalQuizzes.length > 0 || quizzes.length > 0)) {
      // Diff mode: annotate quiz list
      const annotated = annotateQuizzesDiff(originalQuizzes, quizzes);
      if (!showDeletedQuizzes) {
        // Không hiển thị quiz đã xóa nếu flag tắt
        return annotated.filter(q => q._diffStatus !== 'deleted');
      }
      return annotated;
    }
    // Normal mode: chỉ lọc active quizzes
    return quizzes.filter(q => q.isActive !== false);
  }, [quizzes, originalQuizzes, isDiffMode, showDeletedQuizzes]);

  // Đếm quiz active để hiển thị trên button toggle
  const activeQuizCount = isDiffMode
    ? displayQuizzes.filter(q => q._diffStatus !== 'deleted').length
    : displayQuizzes.length;

  // Đếm số quiz có thay đổi để hiển thị badge cảnh báo
  const changedQuizCount = isDiffMode
    ? displayQuizzes.filter(q => q._diffStatus !== 'unchanged').length
    : 0;

  if (displayQuizzes.length === 0 && activeQuizCount === 0) return null;

  return (
    <div className={`mt-3 ml-9 ${isDeletedContext ? 'opacity-60' : ''}`}>

      {/* ── Toggle Button ─────────────────────────────────────────────────────────── */}
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
        {activeQuizCount} câu hỏi Quiz

        {/* Badge cảnh báo nếu có thay đổi trong diff mode */}
        {isDiffMode && changedQuizCount > 0 && (
          <span className={`
            inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold
            ${isOpen ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700 border border-orange-300'}
          `}>
            <AlertTriangle size={8} />
            {changedQuizCount} thay đổi
          </span>
        )}

        {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {/* ── Quiz List (Expandable) ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="mt-2 space-y-2.5 animate-fadeIn">

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-violet-100" />
            <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">
              {isDiffMode ? 'So sánh câu hỏi kiểm tra' : 'Danh sách câu hỏi kiểm tra'}
            </span>
            <div className="h-px flex-1 bg-violet-100" />
          </div>

          {/* Diff legend (chỉ hiển thị khi diff mode) */}
          {isDiffMode && changedQuizCount > 0 && (
            <div className="flex items-center gap-3 flex-wrap p-2.5 bg-violet-50/60 rounded-xl border border-violet-100 mb-3">
              <span className="text-[10px] font-bold text-violet-500 uppercase">Chú thích:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-gray-500">Câu hỏi mới</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-[10px] text-gray-500">Có chỉnh sửa</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-[10px] text-gray-500">Đã xóa</span>
              </div>
            </div>
          )}

          {/* Quiz cards */}
          {displayQuizzes.map((quiz, idx) => (
            <QuizCard
              key={quiz._id || quiz.question || idx}
              quiz={quiz}
              index={idx}
              isDiffMode={isDiffMode}
            />
          ))}

          {/* Footer summary */}
          <div className="flex items-center gap-2 p-2.5 bg-violet-50 rounded-xl border border-violet-100">
            <Trophy size={13} className="text-violet-500 flex-shrink-0" />
            <p className="text-xs text-violet-700">
              <strong>{activeQuizCount}</strong> câu hỏi trắc nghiệm tương tác tại các mốc thời gian trong video
              {isDiffMode && changedQuizCount > 0 && (
                <span className="ml-1 text-orange-600 font-semibold">
                  · {changedQuizCount} thay đổi cần kiểm tra
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPreviewList;
