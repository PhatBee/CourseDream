import React, { useState } from 'react';
import toast from "react-hot-toast";

import StarRating from '../common/StarRating';
import ReportModal from '../common/ReportModal';

import { FaPlay, FaFlag } from 'react-icons/fa';
import { HiOutlineBookOpen, HiOutlineClock, HiOutlineUsers } from 'react-icons/hi';
import { getEmbedUrl } from '../../utils/videoUtils.js';
import reportApi from '../../api/reportApi';

const COURSE_REPORT_REASONS = [
  'Nội dung khóa học không phù hợp - Có hại, bạo lực, thù hận hoặc tội phạm',
  'Nội dung khóa học không phù hợp - Khác',
  'Vi phạm chính sách của nền tảng',
  'Nội dung quảng cáo không phù hợp',
  'Ý khác',
];

const CourseHeader = ({ course }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const {
    title = '',
    description = '',
    shortDescription = '',
    thumbnail = '',
    totalLectures = 0,
    totalHours = 0,
    studentsCount = 0,
    instructor = {},
    categories = [],
    rating = 0,
    reviewCount = 0,
    previewUrl = '',
  } = course;

  const embedUrl = getEmbedUrl(previewUrl);
  const categoryName = categories[0]?.name || 'Course';
  const handlePlayClick = () => {
    if (embedUrl) {
      setIsPlaying(true);
    }
  };

  const handleReportSubmit = async (reason, detail) => {
    await reportApi.reportCourse(course._id, reason + (detail ? `\n${detail}` : ''));
    setReportOpen(false);
    toast.success("Báo cáo của bạn đã được gửi!");
  };

  return (
    <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden text-left">
      <div className="p-4 sm:p-6 lg:flex items-center">

        {/* Cột trái: Thumbnail Video */}
        <div className="relative flex-shrink-0 mb-4 lg:mb-0 lg:w-2/5">
          {isPlaying && embedUrl ? (

            <div className="aspect-video w-full bg-black rounded-md">
              <iframe
                className="w-full h-full rounded-md"
                src={embedUrl}
                title={title}
                allow="autoplay; fullscreen; web-share"
                allowFullScreen
              ></iframe>
            </div>

          ) : (

            <div className="relative aspect-video">
              <img
                className="w-full h-auto object-cover rounded-md aspect-video"
                src={thumbnail || '/default-course.svg'}
                alt={title}
                onError={(e) => { e.target.src = '/default-course.svg'; }}
              />

              {/* 5c. Nếu có link (embedUrl) -> Hiển thị nút Play */}
              {embedUrl && (
                <button
                  onClick={handlePlayClick}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-md group"
                  aria-label="Play video"
                >
                  <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <FaPlay className="text-blue-600 text-2xl" />
                  </div>
                </button>
              )}
            </div>

          )}
        </div>

        {/* Cột phải: Thông tin chi tiết */}
        <div className="w-full lg:pl-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-600 mb-3">{shortDescription}</p>

          {/* Thông số nhanh */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap my-4">
            <span className="flex items-center text-sm font-medium text-gray-700">
              <HiOutlineBookOpen className="mr-1.5 text-gray-500" /> {totalLectures} Lessons
            </span>
            <span className="flex items-center text-sm font-medium text-gray-700">
              <HiOutlineClock className="mr-1.5 text-gray-500" /> {totalHours.toFixed(1)} hours
            </span>
            <span className="flex items-center text-sm font-medium text-gray-700">
              <HiOutlineUsers className="mr-1.5 text-gray-500" /> {studentsCount} Students
            </span>
            <span className="text-xs font-semibold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">{categoryName}</span>
          </div>

          {/* Giảng viên và Rating */}
          <div className="sm:flex items-center justify-between mt-4 border-t pt-4">
            {/* Giảng viên */}
            <div className="flex items-center mb-2 sm:mb-0">
              <img
                className="w-10 h-10 rounded-full object-cover"
                src={instructor.avatar || '/default-avatar.svg'}
                alt={instructor.name || 'Instructor'}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              <div className="ml-3">
                <h5 className="text-base font-semibold text-gray-800">{instructor.name || '...'}</h5>
                <p className="text-sm text-gray-500">Instructor</p>
              </div>
            </div>
            {/* Rating */}
            <div className="flex items-center">
              <StarRating rating={rating} />
              <p className="text-sm ml-2">
                <span className="font-bold text-gray-800">{rating.toFixed(1)}</span>
                <span className="text-gray-500"> ({reviewCount} reviews)</span>
              </p>
            </div>
          </div>

          {/* Nút báo cáo khóa học */}
          <div className="mt-4 flex items-center">
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-red-500"
              aria-label="Report course"
            >
              <FaFlag className="mr-1.5" />
              Báo cáo khóa học
            </button>
          </div>
        </div>
      </div>

      {/* Modal báo cáo khóa học */}
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