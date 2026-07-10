// src/pages/admin/AdminPendingCourseDetail.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAdminPendingDetail,
  adminApproveCourse,
  adminRejectCourse,
  adminRequestChanges
} from '../../features/admin/adminSlice';
import {
  ChevronDown, ChevronUp, Play, X, CheckCircle, ArrowLeft,
  User, Tag, DollarSign, Globe, Layers, Clock, Video,
  BookOpen, Award, List, Cloud, HelpCircle, GitCompare, Sparkles, Trash2, Edit3, AlertTriangle
} from 'lucide-react';
import { createPortal } from 'react-dom';
import Avatar from '../../components/common/Avatar';
import QuizPreviewList from '../../components/admin/QuizPreviewList';
import adminService from '../../features/admin/adminService';
import toast from 'react-hot-toast';

// ========================================================================================
// ── DIFF HELPER FUNCTIONS ──────────────────────────────────────────────────────────────
// Tất cả pure functions, không có side-effect.
// Được đặt ngoài component để tránh re-creation trên mỗi render.
// ========================================================================================

/**
 * So sánh hai giá trị text/số đơn giản.
 * @returns {{ changed: boolean, oldVal: any, newVal: any }}
 */
const diffField = (oldVal, newVal) => {
  const normalize = (v) => (v === undefined || v === null ? '' : String(v).trim());
  const changed = normalize(oldVal) !== normalize(newVal);
  return { changed, oldVal, newVal };
};

// #TODO: util convert abcd => Ab CD
const convertLevelEnum = (level) => {
  switch (level) {
    case 'beginner': return 'Cơ bản';
    case 'intermediate': return 'Trung cấp';
    case 'advanced': return 'Nâng cao';
    case 'alllevels': return 'Mọi cấp độ';
    case 'en': return 'Tiếng Anh';
    case 'vi': return 'Tiếng Việt';
    default: return level;
  }
}


/**
 * So sánh hai mảng string (learnOutcomes, requirements, audience, includes).
 * @returns {{ changed: boolean, added: string[], removed: string[], unchanged: string[] }}
 */
const diffArrayField = (oldArr = [], newArr = []) => {
  const oldSet = new Set((oldArr || []).map(s => String(s).trim()));
  const newSet = new Set((newArr || []).map(s => String(s).trim()));
  const added = [...newSet].filter(s => !oldSet.has(s));
  const removed = [...oldSet].filter(s => !newSet.has(s));
  const unchanged = [...newSet].filter(s => oldSet.has(s));
  return { changed: added.length > 0 || removed.length > 0, added, removed, unchanged };
};


/**
 * So sánh hai mảng lectures, khớp theo `title`.
 * @param {Array} origLectures - Lectures từ originalCourse (populated)
 * @param {Array} revLectures  - Lectures từ revision data
 * @returns {Array} Mảng lectures annotated với `_diffStatus`, `_original`, `_originalQuizzes`
 */
const diffLectures = (origLectures = [], revLectures = []) => {
  const origMap = new Map();
  origLectures.forEach(l => {
    if (l.title) origMap.set(l.title.trim(), l);
  });

  const revMap = new Map();
  const annotatedRevLectures = revLectures.map(l => {
    const key = l.title?.trim() || '';
    const origL = origMap.get(key);
    revMap.set(key, true);

    if (!origL) {
      // Lecture này không tồn tại trong bản gốc → ADDED
      return {
        ...l,
        _diffStatus: 'added',
        _original: null,
        _originalQuizzes: []
      };
    }

    // So sánh các thuộc tính của lecture
    const titleChanged = (origL.title || '') !== (l.title || '');
    const durationChanged = Number(origL.duration) !== Number(l.duration);
    const videoUrlChanged = (origL.videoUrl || '') !== (l.videoUrl || '');
    const previewChanged = Boolean(origL.isPreviewFree) !== Boolean(l.isPreviewFree);
    const resourcesChanged = JSON.stringify(origL.resources || []) !== JSON.stringify(l.resources || []);

    // So sánh quizzes (nếu có)
    const origQuizzes = origL.quizzes || [];
    const revQuizzes = l.quizzes || [];
    const quizzesChanged =
      origQuizzes.length !== revQuizzes.length ||
      JSON.stringify(origQuizzes.map(q => ({ q: q.question, a: q.correctAnswer }))) !==
      JSON.stringify(revQuizzes.map(q => ({ q: q.question, a: q.correctAnswer })));

    const isModified = titleChanged || durationChanged || videoUrlChanged || previewChanged || resourcesChanged || quizzesChanged;

    return {
      ...l,
      _diffStatus: isModified ? 'modified' : 'unchanged',
      _original: origL,
      _originalQuizzes: origQuizzes
    };
  });

  // Lectures bị xóa: tồn tại trong original nhưng không có trong revision
  const deletedLectures = origLectures
    .filter(l => l.title && !revMap.has(l.title.trim()))
    .map(l => ({
      ...l,
      _diffStatus: 'deleted',
      _original: l,
      _originalQuizzes: l.quizzes || []
    }));

  return [...annotatedRevLectures, ...deletedLectures];
};

/**
 * So sánh hai mảng sections, khớp theo `title`.
 * @param {Array} origSections - Sections từ originalCourse (populated với lectures)
 * @param {Array} revSections  - Sections từ revision data
 * @returns {Array} Mảng sections annotated với `_diffStatus` và lectures đã được diff
 */
const diffSections = (origSections = [], revSections = []) => {
  // Xây dựng map từ original sections (khớp theo title)
  const origMap = new Map();
  origSections.forEach(s => {
    if (s.title) origMap.set(s.title.trim(), s);
  });

  const revMap = new Map();

  // Annotate các sections trong revision
  const annotatedRevSections = revSections.map(s => {
    const key = s.title?.trim() || '';
    const origS = origMap.get(key);
    revMap.set(key, true);

    if (!origS) {
      // Section mới → ADDED
      return {
        ...s,
        _diffStatus: 'added',
        _original: null,
        lectures: (s.lectures || []).map(l => ({
          ...l, _diffStatus: 'added', _original: null, _originalQuizzes: []
        }))
      };
    }

    // Section tồn tại ở cả hai → so sánh lectures bên trong
    const diffedLectures = diffLectures(origS.lectures || [], s.lectures || []);
    const sectionTitleChanged = origS.title?.trim() !== s.title?.trim();
    const hasLectureChanges = diffedLectures.some(l => l._diffStatus !== 'unchanged');
    const isModified = sectionTitleChanged || hasLectureChanges;

    return {
      ...s,
      _diffStatus: isModified ? 'modified' : 'unchanged',
      _original: origS,
      lectures: diffedLectures
    };
  });

  // Sections bị xóa
  const deletedSections = origSections
    .filter(s => s.title && !revMap.has(s.title.trim()))
    .map(s => ({
      ...s,
      _diffStatus: 'deleted',
      _original: s,
      lectures: (s.lectures || []).map(l => ({
        ...l, _diffStatus: 'deleted', _original: l, _originalQuizzes: l.quizzes || []
      }))
    }));

  return [...annotatedRevSections, ...deletedSections];
};

/**
 * Tính tổng thống kê thay đổi từ diffedSections để hiển thị trên banner.
 */
const calcDiffStats = (diffedSections) => {
  let addedSections = 0, modifiedSections = 0, deletedSections = 0;
  let addedLectures = 0, modifiedLectures = 0, deletedLectures = 0;

  diffedSections.forEach(s => {
    if (s._diffStatus === 'added') addedSections++;
    if (s._diffStatus === 'modified') modifiedSections++;
    if (s._diffStatus === 'deleted') deletedSections++;
    (s.lectures || []).forEach(l => {
      if (l._diffStatus === 'added') addedLectures++;
      if (l._diffStatus === 'modified') modifiedLectures++;
      if (l._diffStatus === 'deleted') deletedLectures++;
    });
  });

  return { addedSections, modifiedSections, deletedSections, addedLectures, modifiedLectures, deletedLectures };
};


// ======================== MODAL COMPONENTS ========================

const ApproveModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={!isLoading ? onClose : undefined} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative z-10 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận duyệt</h3>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Khóa học sẽ được xuất bản ngay lập tức và hiển thị trên marketplace.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✅ Duyệt ngay'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const RejectModal = ({ isOpen, onClose, onConfirm, isLoading, rejectMessage, setRejectMessage }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={!isLoading ? onClose : undefined} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10">
        <button onClick={onClose} disabled={isLoading} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Từ chối khóa học</h3>
        <p className="text-gray-500 text-sm mb-4">Nhập lý do để giảng viên có thể chỉnh sửa và nộp lại:</p>
        <textarea
          value={rejectMessage}
          onChange={(e) => setRejectMessage(e.target.value)}
          className="w-full border border-gray-200 rounded-xl p-3 mb-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm resize-none"
          placeholder="Ví dụ: Nội dung chưa đầy đủ, cần bổ sung bài học về XYZ..."
          disabled={isLoading}
        />
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50">
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !rejectMessage.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '❌ Từ chối'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ChangesRequestedModal = ({ isOpen, onClose, onConfirm, isLoading, value, onChange }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={!isLoading ? onClose : undefined} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10">
        <button onClick={onClose} disabled={isLoading} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Yêu cầu chỉnh sửa</h3>
            <p className="text-xs text-gray-400 mt-0.5">Instructor sẽ nhận thông báo và có thể sửa lại</p>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-3">Mô tả cụ thể những điểm cần sửa:</p>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-orange-200 rounded-xl p-3 mb-3 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none bg-orange-50/30"
          placeholder="Ví dụ: Bài 3 thiếu phần giải thích. Video chưa có phụ đề..."
          disabled={isLoading}
        />
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4 text-xs text-orange-700">
          ⚠️ <strong>Khác với "Từ chối":</strong> Instructor vẫn có thể chỉnh sửa và gửi lại mà không cần tạo revision mới.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !value.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '⚠️ Gửi yêu cầu sửa'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ======================== CLOUDFRONT VIDEO PLAYER ========================
const CloudFrontVideoPlayer = ({ url, onClose }) => {
  const isCloudFront = url?.includes('cloudfront.net');
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl">
        <button onClick={onClose} className="absolute -top-12 right-0 text-white/70 hover:text-white flex items-center gap-2 text-sm">
          <X size={18} /> Đóng
        </button>
        {isCloudFront ? (
          <video src={url} controls autoPlay className="w-full rounded-2xl shadow-2xl max-h-[80vh]" />
        ) : (
          <iframe
            src={url.replace('watch?v=', 'embed/')}
            className="w-full aspect-video rounded-2xl shadow-2xl"
            allowFullScreen
            title="Video preview"
          />
        )}
      </div>
    </div>,
    document.body
  );
};

// ======================== STANDARD INFO ITEM (dùng khi type === 'new') ========================
const InfoItem = ({ icon, label, value }) => {
  const Ico = icon;
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
        <Ico size={15} className="text-rose-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium text-justify">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5 text-justify">{value || 'N/A'}</p>
      </div>
    </div>
  );
};

// ========================================================================================
// ── DIFF-AWARE UI COMPONENTS ───────────────────────────────────────────────────────────
// ========================================================================================

/**
 * DiffInfoItem — Hiển thị một trường thông tin trong sidebar với so sánh cũ/mới.
 * Nếu không có thay đổi, hiển thị bình thường như InfoItem.
 * Nếu thay đổi: giá trị cũ bị gạch ngang đỏ, giá trị mới in đậm xanh lá.
 */
const DiffInfoItem = ({ icon, label, oldVal, newVal }) => {
  const Ico = icon;
  const { changed } = diffField(oldVal, newVal);
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${changed ? 'bg-amber-50/80 border border-amber-200' : 'bg-gray-50'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 ${changed ? 'bg-amber-100' : 'bg-white'}`}>
        <Ico size={15} className={changed ? 'text-amber-600' : 'text-rose-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5 text-justify">{label}</p>
        {changed ? (
          <div className="space-y-0.5">
            {/* Giá trị cũ: gạch ngang đỏ */}
            <p className="text-xs text-red-400 line-through font-medium text-justify">{oldVal || 'N/A'}</p>
            {/* Giá trị mới: xanh lá đậm */}
            <p className="text-sm text-emerald-700 font-bold text-justify">{newVal || 'N/A'}</p>
          </div>
        ) : (
          <p className="text-sm font-semibold text-gray-800 text-justify">{newVal || 'N/A'}</p>
        )}
      </div>
      {/* Badge nhỏ chỉ thị thay đổi */}
      {changed && (
        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md flex-shrink-0 self-start mt-0.5">
          Đổi
        </span>
      )}
    </div>
  );
};

/**
 * DiffTextBlock — Hiển thị đoạn văn bản (mô tả) với so sánh cũ/mới.
 * Nếu thay đổi: 2 block xếp chồng — cũ (đỏ, gạch ngang nhạt) và mới (xanh lá).
 */
const DiffTextBlock = ({ label, oldText, newText }) => {
  const changed = (oldText || '').trim() !== (newText || '').trim();
  if (!changed) return null;

  return (
    <div className="mt-3 rounded-xl border border-amber-200 overflow-hidden">
      <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
        <Edit3 size={12} className="text-amber-600" />
        <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">{label} đã thay đổi</span>
      </div>
      {oldText && (
        <div className="p-3 bg-red-50/50 border-b border-red-100">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-1">Phiên bản cũ</p>
          <p className="text-xs text-red-500 line-through leading-relaxed text-justify">{oldText}</p>
        </div>
      )}
      {newText && (
        <div className="p-3 bg-emerald-50/50">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Phiên bản mới</p>
          <p className="text-xs text-emerald-800 font-medium leading-relaxed text-justify">{newText}</p>
        </div>
      )}
    </div>
  );
};

/**
 * DiffListBlock — So sánh mảng string (learnOutcomes, requirements...).
 * Hiển thị các mục được thêm mới (xanh lá), bị xóa (đỏ gạch ngang), giữ nguyên (xám).
 * Chỉ render khi có thay đổi.
 */
const DiffListBlock = ({ label, icon: ListIcon, oldArr = [], newArr = [] }) => {
  const { changed, added, removed, unchanged } = diffArrayField(oldArr, newArr);
  if (!changed) return null;

  return (
    <div className="mt-3 rounded-xl border border-amber-200 overflow-hidden">
      <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
        {ListIcon && <ListIcon size={12} className="text-amber-600" />}
        <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">{label} đã thay đổi</span>
        <span className="ml-auto flex items-center gap-1.5">
          {added.length > 0 && (
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">+{added.length} thêm</span>
          )}
          {removed.length > 0 && (
            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">-{removed.length} xóa</span>
          )}
        </span>
      </div>
      <div className="p-3 space-y-1.5 bg-white">
        {/* Mục bị xóa — hiển thị gạch ngang đỏ */}
        {removed.map((item, i) => (
          <div key={`rm-${i}`} className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-500 text-[9px] font-black">-</span>
            </span>
            <span className="text-xs text-red-500 line-through leading-relaxed">{item}</span>
          </div>
        ))}
        {/* Mục giữ nguyên — xám nhạt */}
        {unchanged.map((item, i) => (
          <div key={`uc-${i}`} className="flex items-start gap-2 opacity-50">
            <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gray-400 text-[9px]">•</span>
            </span>
            <span className="text-xs text-gray-500 leading-relaxed">{item}</span>
          </div>
        ))}
        {/* Mục mới thêm — xanh lá đậm */}
        {added.map((item, i) => (
          <div key={`ad-${i}`} className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-emerald-600 text-[9px] font-black">+</span>
            </span>
            <span className="text-xs text-emerald-700 font-semibold leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * DiffCategoryBlock — So sánh danh sách danh mục (categories array of objects {_id, name}).
 */
const DiffCategoryBlock = ({ oldCats = [], newCats = [] }) => {
  const oldNames = new Set((oldCats || []).map(c => (c.name || '').trim()));
  const newNames = new Set((newCats || []).map(c => (c.name || '').trim()));
  const added = [...newCats].filter(c => !oldNames.has((c.name || '').trim()));
  const removed = [...oldCats].filter(c => !newNames.has((c.name || '').trim()));
  const unchanged = [...newCats].filter(c => oldNames.has((c.name || '').trim()));
  const changed = added.length > 0 || removed.length > 0;

  if (!changed) {
    // Danh mục không đổi — hiển thị bình thường
    return (
      <div className="flex flex-wrap gap-2">
        {(newCats || []).map(cat => (
          <span key={cat._id} className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">
            {cat.name}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {removed.map(cat => (
          <span key={cat._id || cat.name} className="px-2.5 py-1 bg-red-50 text-red-400 text-xs font-semibold rounded-full border border-red-200 line-through">
            {cat.name}
          </span>
        ))}
        {unchanged.map(cat => (
          <span key={cat._id || cat.name} className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full border border-gray-200">
            {cat.name}
          </span>
        ))}
        {added.map(cat => (
          <span key={cat._id || cat.name} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-300">
            ✨ {cat.name}
          </span>
        ))}
      </div>
      {(added.length > 0 || removed.length > 0) && (
        <p className="text-[10px] text-amber-600 font-medium">
          {added.length > 0 && `+${added.length} danh mục mới`}
          {added.length > 0 && removed.length > 0 && ' · '}
          {removed.length > 0 && `-${removed.length} bị bỏ`}
        </p>
      )}
    </div>
  );
};

/**
 * DiffBanner — Thanh tóm tắt thay đổi, hiển thị ngay trên nội dung khi type === 'update'.
 * Cho Admin thấy ngay có bao nhiêu mục được thêm / sửa / xóa.
 */
const DiffBanner = ({ stats, fieldChanges }) => {
  const hasChanges =
    stats.addedSections + stats.modifiedSections + stats.deletedSections +
    stats.addedLectures + stats.modifiedLectures + stats.deletedLectures +
    fieldChanges > 0;

  // return (
  //   <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-6">
  //     {/* Header */}
  //     <div className="flex items-center gap-2 mb-3">
  //       <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
  //         <GitCompare size={16} className="text-amber-600" />
  //       </div>
  //       <div>
  //         <h3 className="text-sm font-bold text-amber-800">Chế độ xem thay đổi (Diff Mode)</h3>
  //         <p className="text-xs text-amber-600">Giảng viên đã cập nhật khóa học đang phát hành</p>
  //       </div>
  //       {hasChanges ? (
  //         <span className="ml-auto px-2 py-1 bg-amber-200 text-amber-800 text-xs font-bold rounded-full">
  //           Có thay đổi
  //         </span>
  //       ) : (
  //         <span className="ml-auto px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
  //           Không thay đổi
  //         </span>
  //       )}
  //     </div>

  //     {/* Thống kê nhanh */}
  //     <div className="grid grid-cols-3 gap-2">
  //       {/* ADDED */}
  //       <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
  //         <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
  //           <Sparkles size={12} className="text-emerald-600" />
  //         </div>
  //         <div>
  //           <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Thêm mới</p>
  //           <p className="text-sm font-bold text-emerald-700">
  //             {stats.addedSections > 0 && <span>{stats.addedSections} section</span>}
  //             {stats.addedSections > 0 && stats.addedLectures > 0 && ', '}
  //             {stats.addedLectures > 0 && <span>{stats.addedLectures} bài</span>}
  //             {stats.addedSections === 0 && stats.addedLectures === 0 && '—'}
  //           </p>
  //         </div>
  //       </div>

  //       {/* MODIFIED */}
  //       <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
  //         <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
  //           <Edit3 size={12} className="text-amber-600" />
  //         </div>
  //         <div>
  //           <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">Đã sửa</p>
  //           <p className="text-sm font-bold text-amber-700">
  //             {stats.modifiedSections > 0 && <span>{stats.modifiedSections} section</span>}
  //             {stats.modifiedSections > 0 && stats.modifiedLectures > 0 && ', '}
  //             {stats.modifiedLectures > 0 && <span>{stats.modifiedLectures} bài</span>}
  //             {stats.modifiedSections === 0 && stats.modifiedLectures === 0 && (fieldChanges > 0 ? `${fieldChanges} trường` : '—')}
  //           </p>
  //         </div>
  //       </div>

  //       {/* DELETED */}
  //       <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5">
  //         <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
  //           <Trash2 size={12} className="text-red-500" />
  //         </div>
  //         <div>
  //           <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wide">Đã xóa</p>
  //           <p className="text-sm font-bold text-red-600">
  //             {stats.deletedSections > 0 && <span>{stats.deletedSections} section</span>}
  //             {stats.deletedSections > 0 && stats.deletedLectures > 0 && ', '}
  //             {stats.deletedLectures > 0 && <span>{stats.deletedLectures} bài</span>}
  //             {stats.deletedSections === 0 && stats.deletedLectures === 0 && '—'}
  //           </p>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Chú thích màu */}
  //     <div className="flex items-center gap-4 mt-3 flex-wrap">
  //       <div className="flex items-center gap-1.5">
  //         <div className="w-3 h-3 rounded-full bg-emerald-400" />
  //         <span className="text-[10px] text-gray-500 font-medium">✨ Thêm mới</span>
  //       </div>
  //       <div className="flex items-center gap-1.5">
  //         <div className="w-3 h-3 rounded-full bg-amber-400" />
  //         <span className="text-[10px] text-gray-500 font-medium">✏️ Có sửa đổi</span>
  //       </div>
  //       <div className="flex items-center gap-1.5">
  //         <div className="w-3 h-3 rounded-full bg-red-400" />
  //         <span className="text-[10px] text-gray-500 font-medium">🗑️ Đã xóa</span>
  //       </div>
  //       <div className="flex items-center gap-1.5">
  //         <div className="w-3 h-3 rounded-full bg-gray-300" />
  //         <span className="text-[10px] text-gray-500 font-medium">Không đổi</span>
  //       </div>
  //     </div>
  //   </div>
  // );
};

/**
 * DiffStatusBadge — Badge nhỏ chỉ thị trạng thái của section/lecture.
 */
const DiffStatusBadge = ({ status }) => {
  const configs = {
    added: { label: '✨ Thêm mới', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    modified: { label: '✏️ Có thay đổi', className: 'bg-amber-100 text-amber-700 border-amber-300' },
    deleted: { label: '🗑️ Đã xóa', className: 'bg-red-100 text-red-600 border-red-300' },
    unchanged: { label: null, className: '' }
  };
  const config = configs[status] || configs.unchanged;
  if (!config.label) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.className}`}>
      {config.label}
    </span>
  );
};

/**
 * LectureTitleDiff — Hiển thị tiêu đề lecture với diff nếu title bị sửa.
 */
const LectureTitleDiff = ({ lecture }) => {
  if (lecture._diffStatus !== 'modified' || !lecture._original) {
    return (
      <p className={`text-sm font-medium ${lecture._diffStatus === 'deleted' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {lecture.title}
      </p>
    );
  }

  const titleChanged = lecture._original.title?.trim() !== lecture.title?.trim();
  if (!titleChanged) {
    return <p className="text-sm text-gray-800 font-medium">{lecture.title}</p>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {/* Tiêu đề cũ: gạch ngang đỏ */}
      <p className="text-xs text-red-400 line-through leading-snug">{lecture._original.title}</p>
      {/* Tiêu đề mới: amber/vàng đậm */}
      <p className="text-sm text-amber-700 font-bold leading-snug">{lecture.title}</p>
    </div>
  );
};


// ======================== MAIN COMPONENT ========================
const AdminPendingCourseDetail = () => {
  const { revisionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { adminPendingDetail, isLoading, adminActionLoading } = useSelector(state => state.admin);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [rejectMessage, setRejectMessage] = useState('');
  const [changesMessage, setChangesMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState([0]);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoLoadingUrl, setVideoLoadingUrl] = useState(null);

  const handlePlayVideo = async (videoUrl) => {
    if (!videoUrl) return;

    if (videoUrl.includes('cloudfront.net')) {
      try {
        setVideoLoadingUrl(videoUrl);
        const res = await adminService.getVideoSignedUrl(videoUrl);
        if (res && res.signedUrl) {
          setVideoPreview(res.signedUrl);
        } else {
          toast.error('Không thể tạo signed URL cho video này');
        }
      } catch (error) {
        console.error('Error fetching signed video URL:', error);
        toast.error('Có lỗi xảy ra khi ký URL video');
      } finally {
        setVideoLoadingUrl(null);
      }
    } else {
      setVideoPreview(videoUrl);
    }
  };

  useEffect(() => {
    dispatch(getAdminPendingDetail(revisionId));
  }, [dispatch, revisionId]);

  // ── Diff Computation (useMemo) ─────────────────────────────────────────────────────
  // Chỉ tính lại khi adminPendingDetail thay đổi. Không bao giờ chạy lại do state UI.
  const diffedSections = useMemo(() => {
    if (!adminPendingDetail || adminPendingDetail.type !== 'update' || !adminPendingDetail.originalCourse) {
      return null;
    }
    return diffSections(
      adminPendingDetail.originalCourse.sections || [],
      adminPendingDetail.revision.sections || []
    );
  }, [adminPendingDetail]);

  // Tính stats tổng hợp từ diffedSections
  const diffStats = useMemo(() => {
    if (!diffedSections) return null;
    return calcDiffStats(diffedSections);
  }, [diffedSections]);

  // Đếm số trường metadata bị thay đổi (cả scalar lẫn array fields)
  const metaFieldChanges = useMemo(() => {
    if (!adminPendingDetail || adminPendingDetail.type !== 'update' || !adminPendingDetail.originalCourse) return 0;
    const { revision, originalCourse } = adminPendingDetail;
    // Scalar fields
    const scalarFields = ['title', 'price', 'priceDiscount', 'level', 'language', 'shortDescription'];
    const scalarChanges = scalarFields.filter(f => diffField(originalCourse[f], revision[f]).changed).length;
    // Array fields
    const arrayFields = ['learnOutcomes', 'requirements', 'audience', 'includes'];
    const arrayChanges = arrayFields.filter(f => diffArrayField(originalCourse[f], revision[f]).changed).length;
    // Category diff
    const oldCatIds = (originalCourse.categories || []).map(c => (c._id || c).toString()).sort().join(',');
    const newCatIds = (revision.categories || []).map(c => (c._id || c).toString()).sort().join(',');
    const catChanged = oldCatIds !== newCatIds ? 1 : 0;
    return scalarChanges + arrayChanges + catChanged;
  }, [adminPendingDetail]);

  // ── Action Handlers ────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    const result = await dispatch(adminApproveCourse(revisionId));
    if (result.type.endsWith('/fulfilled')) {
      setShowApproveModal(false);
      navigate('/admin/courses');
    }
  };

  const handleReject = async () => {
    if (!rejectMessage.trim()) return;
    const result = await dispatch(adminRejectCourse({ revisionId, reviewMessage: rejectMessage }));
    if (result.type.endsWith('/fulfilled')) {
      setShowRejectModal(false);
      navigate('/admin/courses');
    }
  };

  const handleRequestChanges = async () => {
    if (!changesMessage.trim()) return;
    const result = await dispatch(adminRequestChanges({ revisionId, reviewMessage: changesMessage }));
    if (result.type.endsWith('/fulfilled')) {
      setShowChangesModal(false);
      navigate('/admin/courses');
    }
  };

  const toggleSection = (idx) => {
    setExpandedSections(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  // ── Loading & Empty States ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Đang tải chi tiết...</p>
      </div>
    );
  }

  if (!adminPendingDetail) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Không tìm thấy dữ liệu</p>
    </div>
  );

  const { revision, originalCourse, type } = adminPendingDetail;
  const isDiffMode = type === 'update' && !!originalCourse;

  const formatVND = (num) => (num || 0).toLocaleString('vi-VN') + '₫';

  // Sections để render: nếu diff mode dùng diffedSections, ngược lại dùng revision.sections
  const sectionsToRender = isDiffMode && diffedSections ? diffedSections : (revision.sections || []).map(s => ({ ...s, _diffStatus: 'unchanged' }));

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Top Bar ──────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/courses')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={18} /> Quay lại
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-gray-900 text-lg line-clamp-1 max-w-md">{revision.title}</h1>
                {type === 'new' ? (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">Mới</span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">Cập nhật</span>
                )}
                {/* Diff mode indicator */}
                {isDiffMode && (
                  <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-bold rounded-full border border-violet-200 flex items-center gap-1">
                    <GitCompare size={9} /> DIFF
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 text-justify">
                Giảng viên: <span className="font-medium text-gray-600 text-justify">{revision.instructor?.name}</span> • {revision.instructor?.email}
              </p>
            </div>
          </div>

          {/* 3 Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowApproveModal(true)}
              disabled={adminActionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-sm text-sm disabled:opacity-50"
            >
              <CheckCircle size={15} /> Duyệt
            </button>
            <button
              onClick={() => setShowChangesModal(true)}
              disabled={adminActionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm text-sm disabled:opacity-50"
            >
              ⚠️ Yêu cầu sửa
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={adminActionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors shadow-sm text-sm disabled:opacity-50"
            >
              <X size={15} /> Từ chối
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ===== LEFT COLUMN: Main Content ===== */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Diff Banner (chỉ hiện khi type === 'update') ─────────────────── */}
            {isDiffMode && diffStats && (
              <DiffBanner stats={diffStats} fieldChanges={metaFieldChanges} />
            )}

            {/* Thumbnail */}
            {revision.thumbnail && (
              <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <img crossOrigin="anonymous"
                  src={revision.thumbnail}
                  alt={revision.title}
                  className="w-full aspect-video object-cover"
                />
                {revision.previewUrl && (
                  <button
                    onClick={() => handlePlayVideo(revision.previewUrl)}
                    disabled={!!videoLoadingUrl}
                    className="absolute inset-0 flex items-center justify-center group disabled:opacity-70"
                  >
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      {videoLoadingUrl === revision.previewUrl ? (
                        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play size={24} className="text-rose-600 ml-1" />
                      )}
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Descriptions */}
            <div className={`bg-white rounded-2xl shadow-sm p-6 border ${isDiffMode && diffField(originalCourse?.shortDescription, revision.shortDescription).changed
              ? 'border-amber-200' : 'border-gray-100'
              }`}>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen size={18} className="text-rose-500" /> Mô tả khóa học
                {isDiffMode && diffField(originalCourse?.shortDescription, revision.shortDescription).changed && (
                  <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    Đã sửa
                  </span>
                )}
              </h2>

              {/* ── Diff: shortDescription ───────────────────────────────── */}
              {isDiffMode ? (
                <>
                  {diffField(originalCourse?.shortDescription, revision.shortDescription).changed ? (
                    // Có thay đổi: Hiển thị song song cũ/mới
                    <div className="rounded-xl border border-amber-200 overflow-hidden mb-3">
                      <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-100">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Mô tả ngắn</span>
                      </div>
                      <div className="p-3 bg-red-50/40 border-b border-red-100">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-1">Phiên bản cũ</p>
                        <p className="text-xs text-red-500 line-through leading-relaxed text-justify">
                          {originalCourse?.shortDescription || '(trống)'}
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-50/40">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Phiên bản mới</p>
                        <p className="text-sm text-emerald-800 font-medium leading-relaxed text-justify">
                          {revision.shortDescription}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Không đổi: hiển thị bình thường
                    <p className="text-gray-600 text-sm leading-relaxed mb-3 text-justify">{revision.shortDescription}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-600 text-sm leading-relaxed mb-4 text-justify">{revision.shortDescription}</p>
              )}

              {revision.description && (
                <div
                  className="prose prose-sm max-w-none text-gray-600 text-justify mt-4"
                  dangerouslySetInnerHTML={{ __html: revision.description }}
                />
              )}
            </div>

            {/* Learn Outcomes — diff-aware */}
            {(revision.learnOutcomes?.length > 0 || (isDiffMode && originalCourse?.learnOutcomes?.length > 0)) && (() => {
              const learnDiff = isDiffMode ? diffArrayField(originalCourse?.learnOutcomes, revision.learnOutcomes) : null;
              return (
                <div className={`bg-white rounded-2xl shadow-sm p-6 border ${learnDiff?.changed ? 'border-amber-200' : 'border-gray-100'
                  }`}>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Award size={18} className="text-rose-500" /> Học viên sẽ học được
                    {learnDiff?.changed && (
                      <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                        Ä Đã sửa
                      </span>
                    )}
                  </h2>
                  {isDiffMode && learnDiff?.changed ? (
                    // Diff mode có thay đổi: hiển thị 3 trạng thái
                    <div className="space-y-1.5">
                      {learnDiff.removed.map((item, i) => (
                        <div key={`rm-${i}`} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-red-500 text-[10px] font-black">-</span>
                          </span>
                          <span className="text-sm text-red-400 line-through leading-relaxed">{item}</span>
                        </div>
                      ))}
                      {learnDiff.unchanged.map((item, i) => (
                        <div key={`uc-${i}`} className="flex items-start gap-2 text-sm text-justify">
                          <CheckCircle size={15} className="text-gray-300 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-500">{item}</span>
                        </div>
                      ))}
                      {learnDiff.added.map((item, i) => (
                        <div key={`ad-${i}`} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-emerald-600 text-[10px] font-black">+</span>
                          </span>
                          <span className="text-sm text-emerald-700 font-semibold leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Hiển thị bình thường
                    <ul className="space-y-2">
                      {revision.learnOutcomes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-justify">
                          <CheckCircle size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}

            {/* Requirements — diff-aware */}
            {(revision.requirements?.length > 0 || (isDiffMode && originalCourse?.requirements?.length > 0)) && (() => {
              const reqDiff = isDiffMode ? diffArrayField(originalCourse?.requirements, revision.requirements) : null;
              return (
                <div className={`bg-white rounded-2xl shadow-sm p-6 border ${reqDiff?.changed ? 'border-amber-200' : 'border-gray-100'
                  }`}>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <List size={18} className="text-rose-500" /> Yêu cầu trước khi học
                    {reqDiff?.changed && (
                      <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                        Ä Đã sửa
                      </span>
                    )}
                  </h2>
                  {isDiffMode && reqDiff?.changed ? (
                    <div className="space-y-1.5">
                      {reqDiff.removed.map((item, i) => (
                        <div key={`rm-${i}`} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-red-500 text-[9px] font-black">-</span>
                          </span>
                          <span className="text-sm text-red-400 line-through leading-relaxed">{item}</span>
                        </div>
                      ))}
                      {reqDiff.unchanged.map((item, i) => (
                        <li key={`uc-${i}`} className="flex items-start gap-2 text-sm list-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0 mt-2" />
                          <span className="text-gray-400">{item}</span>
                        </li>
                      ))}
                      {reqDiff.added.map((item, i) => (
                        <div key={`ad-${i}`} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-emerald-600 text-[9px] font-black">+</span>
                          </span>
                          <span className="text-sm text-emerald-700 font-semibold leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {revision.requirements.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}

            {/* ── Curriculum Tree ───────────────────────────────────────────────── */}
            {sectionsToRender.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Layers size={18} className="text-rose-500" /> Nội dung khóa học
                  <span className="text-sm font-normal text-gray-400">
                    ({revision.sections?.length || 0} sections •{' '}
                    {(revision.sections || []).reduce((acc, s) => acc + (s.lectures?.length || 0), 0)} bài học)
                  </span>
                  {/* Diff mode badge */}
                  {isDiffMode && (
                    <span className="ml-auto text-[10px] text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <GitCompare size={9} /> So sánh thay đổi
                    </span>
                  )}
                </h2>

                <div className="space-y-3">
                  {sectionsToRender.map((section, sIdx) => {
                    // ── Section styling theo _diffStatus ────────────────────────
                    const sStatus = section._diffStatus || 'unchanged';
                    const sectionBorderClass = {
                      added: 'border-emerald-300 bg-emerald-50/60',
                      modified: 'border-amber-200 bg-amber-50/40',
                      deleted: 'border-red-200 bg-red-50/30 opacity-75',
                      unchanged: 'border-gray-100'
                    }[sStatus];
                    const sectionHeaderClass = {
                      added: 'bg-emerald-50 hover:bg-emerald-100/70',
                      modified: 'bg-amber-50/60 hover:bg-amber-100/60',
                      deleted: 'bg-red-50/40 hover:bg-red-50/60',
                      unchanged: 'bg-gray-50 hover:bg-gray-100'
                    }[sStatus];
                    const sectionNumberClass = {
                      added: 'bg-emerald-100 text-emerald-700',
                      modified: 'bg-amber-100 text-amber-700',
                      deleted: 'bg-red-100 text-red-500',
                      unchanged: 'bg-rose-100 text-rose-600'
                    }[sStatus];

                    return (
                      <div key={sIdx} className={`border rounded-xl overflow-hidden transition-colors ${sectionBorderClass}`}>
                        {/* Section Header */}
                        <button
                          onClick={() => toggleSection(sIdx)}
                          className={`w-full flex items-center justify-between p-4 transition-colors text-left ${sectionHeaderClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${sectionNumberClass}`}>
                              {sIdx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-semibold text-sm ${sStatus === 'deleted' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                  {section.title}
                                </h4>
                                {/* Diff status badge chỉ hiện khi diff mode */}
                                {isDiffMode && <DiffStatusBadge status={sStatus} />}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {(section.lectures || []).filter(l => l._diffStatus !== 'deleted').length} bài học
                                {isDiffMode && sStatus === 'deleted' && ' (đã xóa toàn bộ)'}
                              </p>
                            </div>
                          </div>
                          {expandedSections.includes(sIdx)
                            ? <ChevronUp size={18} className="text-gray-400" />
                            : <ChevronDown size={18} className="text-gray-400" />}
                        </button>

                        {/* Section Lectures */}
                        {expandedSections.includes(sIdx) && section.lectures?.length > 0 && (
                          <ul className="divide-y divide-gray-50/80">
                            {section.lectures.map((lecture, lIdx) => {
                              // ── Lecture styling theo _diffStatus ────────────────
                              const lStatus = lecture._diffStatus || 'unchanged';
                              const lectureBg = {
                                added: 'bg-emerald-50/50 hover:bg-emerald-50',
                                modified: 'bg-amber-50/40 hover:bg-amber-50/60',
                                deleted: 'bg-red-50/30 hover:bg-red-50/50',
                                unchanged: 'hover:bg-gray-50'
                              }[lStatus];
                              const lectureIconBg = {
                                added: 'bg-emerald-100',
                                modified: 'bg-amber-100',
                                deleted: 'bg-red-100',
                                unchanged: 'bg-gray-100'
                              }[lStatus];
                              const lectureIconColor = {
                                added: 'text-emerald-500',
                                modified: 'text-amber-500',
                                deleted: 'text-red-400',
                                unchanged: 'text-gray-400'
                              }[lStatus];

                              return (
                                <li key={lIdx} className={`p-3.5 transition-colors ${lectureBg}`}>
                                  {/* Lecture Header Row */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      {/* Icon */}
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${lectureIconBg}`}>
                                        {lStatus === 'deleted'
                                          ? <Trash2 size={10} className={lectureIconColor} />
                                          : lStatus === 'added'
                                            ? <Sparkles size={10} className={lectureIconColor} />
                                            : <Play size={11} className={lectureIconColor} />
                                        }
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        {/* Title — diff-aware */}
                                        {isDiffMode
                                          ? <LectureTitleDiff lecture={lecture} />
                                          : <p className="text-sm text-gray-800 truncate font-medium">{lecture.title}</p>
                                        }

                                        {/* Meta row */}
                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                          {/* Duration với diff highlight */}
                                          <span className={`text-xs ${isDiffMode && lecture._original && Number(lecture._original.duration) !== Number(lecture.duration) ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                                            {Math.floor(lecture.duration / 60)}:{String(lecture.duration % 60).padStart(2, '0')}
                                            {/* Nếu duration bị sửa: hiển thị duration cũ bên cạnh */}
                                            {isDiffMode && lecture._original && Number(lecture._original.duration) !== Number(lecture.duration) && (
                                              <span className="ml-1 text-red-400 line-through font-normal text-[10px]">
                                                ({Math.floor(lecture._original.duration / 60)}:{String(lecture._original.duration % 60).padStart(2, '0')})
                                              </span>
                                            )}
                                          </span>

                                          {lecture.isPreviewFree && (
                                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-xs rounded font-medium">Preview</span>
                                          )}

                                          {lecture.resources?.length > 0 && (
                                            <span className="text-xs text-indigo-500 font-medium">
                                              📎 {lecture.resources.length} tài liệu
                                            </span>
                                          )}

                                          {lecture.quizzes?.filter(q => q.isActive !== false).length > 0 && (
                                            <span className="inline-flex items-center gap-1 text-xs text-violet-600 font-bold px-1.5 py-0.5 bg-violet-50 rounded border border-violet-200">
                                              <HelpCircle size={9} />
                                              {lecture.quizzes.filter(q => q.isActive !== false).length} quiz
                                            </span>
                                          )}

                                          {/* Diff status badge cho lecture */}
                                          {isDiffMode && <DiffStatusBadge status={lStatus} />}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Video button (ẩn nếu lecture bị xóa) */}
                                    {lecture.videoUrl && lStatus !== 'deleted' && (
                                      <button
                                        onClick={() => handlePlayVideo(lecture.videoUrl)}
                                        disabled={!!videoLoadingUrl}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex-shrink-0 ml-2 disabled:opacity-50"
                                      >
                                        {videoLoadingUrl === lecture.videoUrl ? (
                                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <Video size={12} />
                                        )}
                                        Xem video
                                      </button>
                                    )}
                                  </div>

                                  {/* Resources Section */}
                                  {lecture.resources?.length > 0 && lStatus !== 'deleted' && (
                                    <div className="mt-2 ml-9 space-y-1.5">
                                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tài liệu đính kèm</p>
                                      {lecture.resources.map((res, rIdx) => (
                                        <div key={rIdx} className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                          {res.type === 'link' ? (
                                            <>
                                              <span className="text-indigo-400 flex-shrink-0">🔗</span>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-700 truncate">{res.title || res.url}</p>
                                                <a
                                                  href={res.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-indigo-600 hover:underline truncate block"
                                                >
                                                  {res.url}
                                                </a>
                                              </div>
                                              <a
                                                href={res.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-shrink-0 text-xs px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                              >
                                                Mở
                                              </a>
                                            </>
                                          ) : (
                                            <>
                                              <span className="text-indigo-400 flex-shrink-0">📄</span>
                                              {res.url && (
                                                <a
                                                  href={res.url}
                                                  download={res.title}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex-shrink-0 text-xs px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                                >
                                                  Tải
                                                </a>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* ── Quiz Preview Section ─────────────────────────── */}
                                  {/* Khi diff mode: truyền originalQuizzes để QuizPreviewList tự diff bên trong */}
                                  {(lecture.quizzes?.length > 0 || (lecture._originalQuizzes?.length > 0 && lStatus !== 'deleted')) && (
                                    <QuizPreviewList
                                      quizzes={lStatus === 'deleted' ? [] : (lecture.quizzes || [])}
                                      originalQuizzes={isDiffMode ? (lecture._originalQuizzes || []) : []}
                                      isDiffMode={isDiffMode && lStatus !== 'added'}
                                      showDeletedQuizzes={isDiffMode && lStatus !== 'added'}
                                    />
                                  )}

                                  {/* Nếu lecture bị xóa: vẫn hiển thị quiz của nó từ original */}
                                  {lStatus === 'deleted' && lecture._originalQuizzes?.length > 0 && (
                                    <QuizPreviewList
                                      quizzes={lecture._originalQuizzes}
                                      originalQuizzes={[]}
                                      isDiffMode={false}
                                      isDeletedContext={true}
                                    />
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ===== RIGHT COLUMN: Sidebar ===== */}
          <div className="space-y-5">

            {/* Course Info Card — Full Diff */}
            <div className={`bg-white rounded-2xl shadow-sm p-5 border ${isDiffMode && metaFieldChanges > 0 ? 'border-amber-200' : 'border-gray-100'
              }`}>
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                Thông tin khóa học
                {/* {isDiffMode && metaFieldChanges > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    {metaFieldChanges} trường đã đổi
                  </span>
                )}
                {isDiffMode && metaFieldChanges === 0 && (
                  <span className="ml-auto text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full font-medium">
                    Diff
                  </span>
                )} */}
              </h3>
              <div className="space-y-3">
                {isDiffMode ? (
                  // ── Diff-aware info items: tất cả các trường ─────────────────
                  <>
                    {/* Tiêu đề khóa học */}
                    <DiffInfoItem
                      icon={BookOpen}
                      label="Tiêu đề"
                      oldVal={originalCourse?.title}
                      newVal={revision.title}
                    />
                    {/* Giá */}
                    <DiffInfoItem
                      icon={DollarSign}
                      label="Giá gốc"
                      oldVal={formatVND(originalCourse?.price)}
                      newVal={formatVND(revision.price)}
                    />
                    <DiffInfoItem
                      icon={DollarSign}
                      label="Giá khuyến mãi"
                      oldVal={formatVND(originalCourse?.priceDiscount)}
                      newVal={formatVND(revision.priceDiscount)}
                    />
                    {/* Thời hạn hoàn thành khóa học */}
                    <DiffInfoItem
                      icon={Clock}
                      label="Thời hạn hoàn thành"
                      oldVal={originalCourse?.durationInWeeks ? `${originalCourse.durationInWeeks} tuần` : 'N/A tuần'}
                      newVal={revision.durationInWeeks ? `${revision.durationInWeeks} tuần` : 'N/A tuần'}
                    />
                    {/* Cấp độ & Ngôn ngữ */}
                    <DiffInfoItem
                      icon={Award}
                      label="Cấp độ"
                      oldVal={convertLevelEnum(originalCourse?.level)}
                      newVal={convertLevelEnum(revision.level)}
                    />
                    <DiffInfoItem
                      icon={Globe}
                      label="Ngôn ngữ"
                      oldVal={convertLevelEnum(originalCourse?.language)}
                      newVal={convertLevelEnum(revision.language)}
                    />
                    {/* Slug không thay đổi khi update → hiển thị bình thường */}
                    <InfoItem icon={Tag} label="Slug (không đổi)" value={revision.slug} />
                  </>
                ) : (
                  // ── Standard info items (type === 'new') ──────────────────────
                  <>
                    <InfoItem icon={DollarSign} label="Giá gốc" value={formatVND(revision.price)} />
                    <InfoItem icon={DollarSign} label="Giá khuyến mãi" value={formatVND(revision.priceDiscount)} />
                    <InfoItem icon={Award} label="Cấp độ" value={revision.level} />
                    <InfoItem icon={Globe} label="Ngôn ngữ" value={revision.language} />
                    <InfoItem icon={Tag} label="Slug" value={revision.slug} />
                  </>
                )}
              </div>
            </div>

            {/* Instructor Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide ">Giảng viên</h3>
              <div className="flex items-center gap-3">
                <Avatar
                  src={revision.instructor?.avatar}
                  alt={revision.instructor?.name}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                />
                <div>
                  <p className="font-bold text-gray-900 text-sm text-justify">{revision.instructor?.name}</p>
                  <p className="text-xs text-gray-400">{revision.instructor?.email}</p>
                </div>
              </div>
            </div>

            {/* Categories — diff-aware */}
            {(revision.categories?.length > 0 || (isDiffMode && originalCourse?.categories?.length > 0)) && (() => {
              const oldCatNames = new Set((originalCourse?.categories || []).map(c => (c.name || '').trim()));
              const newCatNames = new Set((revision.categories || []).map(c => (c.name || '').trim()));
              const catChanged = isDiffMode && (
                [...oldCatNames].some(n => !newCatNames.has(n)) ||
                [...newCatNames].some(n => !oldCatNames.has(n))
              );
              return (
                <div className={`bg-white rounded-2xl shadow-sm p-5 border ${catChanged ? 'border-amber-200' : 'border-gray-100'
                  }`}>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                    Danh mục
                    {catChanged && (
                      <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                        Ä Đã đổi
                      </span>
                    )}
                  </h3>
                  {isDiffMode ? (
                    <DiffCategoryBlock
                      oldCats={originalCourse?.categories || []}
                      newCats={revision.categories || []}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {revision.categories.map((cat) => (
                        <span key={cat._id} className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <button
                onClick={() => setShowApproveModal(true)}
                disabled={adminActionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={18} /> Duyệt khóa học
              </button>
              <button
                onClick={() => setShowChangesModal(true)}
                disabled={adminActionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                ⚠️ Yêu cầu sửa
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={adminActionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                <X size={18} /> Từ chối
              </button>
              <button
                onClick={() => navigate('/admin/courses')}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                ← Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ApproveModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleApprove}
        isLoading={adminActionLoading}
      />
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectMessage(''); }}
        onConfirm={handleReject}
        isLoading={adminActionLoading}
        rejectMessage={rejectMessage}
        setRejectMessage={setRejectMessage}
      />
      <ChangesRequestedModal
        isOpen={showChangesModal}
        onClose={() => { setShowChangesModal(false); setChangesMessage(''); }}
        onConfirm={handleRequestChanges}
        isLoading={adminActionLoading}
        value={changesMessage}
        onChange={setChangesMessage}
      />

      {/* Video Preview */}
      {videoPreview && (
        <CloudFrontVideoPlayer
          url={videoPreview}
          onClose={() => setVideoPreview(null)}
        />
      )}
    </div>
  );
};

export default AdminPendingCourseDetail;
