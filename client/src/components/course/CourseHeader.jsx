// src/components/course/CourseHeader.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { FaFlag } from 'react-icons/fa';
import { HiOutlineBookOpen, HiOutlineClock, HiOutlineUsers } from 'react-icons/hi';
import { Cloud } from 'lucide-react';
import StarRating from '../common/StarRating';
import ReportModal from '../common/ReportModal';
import CoursePreviewPlayer from './CoursePreviewPlayer';
import { sendReport, resetReportState } from '../../features/report/reportSlice';

const COURSE_REPORT_REASONS = [
  'Nội dung khóa học không phù hợp - Có hại, bạo lực, thù hận hoặc tội phạm',
  'Nội dung khóa học không phù hợp - Khác',
  'Vi phạm chính sách của nền tảng',
  'Nội dung quảng cáo không phù hợp',
  'Ý khác',
];

const CourseHeader = ({ course, reviewCount }) => {
  const [reportOpen, setReportOpen] = useState(false);
  const dispatch = useDispatch();
  const { success, error } = useSelector(state => state.report);
  const currentUser = useSelector(state => state.auth.user);

  const {
    title = '',
    shortDescription = '',
    totalLectures = 0,
    totalHours = 0,
    studentsCount = 0,
    instructor = {},
    categories = [],
    rating = 0,
  } = course;

  useEffect(() => {
    if (success) {
      toast.success('Báo cáo của bạn đã được gửi!');
      dispatch(resetReportState());
      setReportOpen(false);
    }
    if (error) {
      toast.error(error);
      dispatch(resetReportState());
    }
  }, [success, error, dispatch]);

  const handleReportSubmit = (reason, detail) => {
    dispatch(sendReport({
      type: 'course',
      targetId: course._id,
      reason: reason + (detail ? `\n${detail}` : ''),
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left">
      <div className="p-5 sm:p-7 lg:flex items-start gap-8">

        {/* === CỘT TRÁI: Video Preview Player (AWS CloudFront) === */}
        <div className="flex-shrink-0 w-full lg:w-2/5 mb-5 lg:mb-0">
          <CoursePreviewPlayer course={course} />

          {/* AWS CDN indicator */}
          {(course.thumbnail || course.previewUrl) && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
              <Cloud size={11} className="text-blue-400" />
              <span>Media by <span className="font-medium">AWS CloudFront CDN</span></span>
            </div>
          )}
        </div>

        {/* === CỘT PHẢI: Thông tin khóa học === */}
        <div className="flex-1 min-w-0">
          {/* Category Badge */}
          <div className="mb-3">
            {/* Lấy tất cả category name của course */}
            {categories.map((category, index) => (
              <span key={index} className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-full border border-rose-200 uppercase tracking-wide">
                {category.name}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">{title}</h1>

          {/* Short Description */}
          <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-3">{shortDescription}</p>

          {/* Rating Row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <StarRating rating={rating} />
              <span className="font-bold text-amber-600 text-sm">{rating.toFixed(1)}</span>
              <span className="text-gray-400 text-sm">({reviewCount} đánh giá)</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap mb-5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl">
              <HiOutlineBookOpen className="text-rose-500" size={16} />
              {totalLectures} bài học
            </span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl">
              <HiOutlineClock className="text-rose-500" size={16} />
              {typeof totalHours === 'number' ? totalHours.toFixed(1) : totalHours} giờ
            </span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl">
              <HiOutlineUsers className="text-rose-500" size={16} />
              {(studentsCount || 0).toLocaleString('vi-VN')} học viên
            </span>
          </div>

          {/* Instructor */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              <img
                className="w-11 h-11 rounded-full object-cover border-2 border-rose-100 shadow-sm"
                src={instructor.avatar || '/default-avatar.svg'}
                alt={instructor.name || 'Instructor'}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Giảng viên</p>
                <h5 className="text-sm font-bold text-gray-800">{instructor.name || '...'}</h5>
              </div>
            </div>

            {/* Report button */}
            {currentUser?._id !== instructor?._id && (
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-500 transition-colors"
                aria-label="Report course"
              >
                <FaFlag size={11} /> Báo cáo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
        reasons={COURSE_REPORT_REASONS}
      />
    </div>
  );
};

export default CourseHeader;