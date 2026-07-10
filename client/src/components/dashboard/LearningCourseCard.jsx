import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Award, RefreshCw } from 'lucide-react';
import ProgressBar from '../common/ProgressBar';
import { useDispatch } from 'react-redux';
import { activateEnrollmentThunk } from '../../features/enrollment/enrollmentSlice';
import { toast } from 'react-hot-toast';
import CourseExtensionModal from '../course/CourseExtensionModal';

const LearningCourseCard = ({ enrollment }) => {
  const dispatch = useDispatch();
  const [isExtensionOpen, setIsExtensionOpen] = useState(false);
  const { course, learningProgress, isActivated, _id: enrollmentId, endedAt } = enrollment;

  if (!course) return null;

  const progress = learningProgress;
  const isExpired = endedAt && new Date(endedAt) < new Date();

  const handleActivateCourse = async (e) => {
    e.preventDefault();
    if (!enrollmentId) {
      toast.error("Không tìm thấy mã kích hoạt khóa học.");
      return;
    }
    try {
      await dispatch(activateEnrollmentThunk(enrollmentId)).unwrap();
      toast.success("Kích hoạt khóa học thành công!");
    } catch (err) {
      toast.error(err || "Kích hoạt khóa học thất bại.");
    }
  };

  return (
    <>
    <div className="flex flex-col md:flex-row bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* 1. Thumbnail */}
      <div className="w-full md:w-64 h-40 md:h-auto relative flex-shrink-0">
        <img
          src={course.thumbnail || '/default-course.svg'}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        {/* Overlay icon play */}
        <Link to={`/courses/${course.slug}/overview`} className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <PlayCircle size={48} className="text-white drop-shadow-lg" />
        </Link>
      </div>

      {/* 2. Content */}
      <div className="p-5 flex flex-col justify-between w-full">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-gray-900 text-lg line-clamp-1 hover:text-rose-600 transition-colors">
              <Link to={`/courses/${course.slug}/overview`}>{course.title}</Link>
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-4 text-justify">Giảng viên: {course.instructor?.name}</p>
        </div>

        {/* 3. Progress Section */}
        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-gray-600 mb-1.5">
            <span>{progress.percentage}% Hoàn thành</span>
            <span>{progress.completedLessons}/{progress.totalLessons} Bài học</span>
          </div>

          <ProgressBar percentage={progress.percentage} color="bg-rose-500" />

          <div className="mt-4 flex justify-between items-center">
            {isExpired ? (
              <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                Đã hết hạn
              </span>
            ) : !isActivated ? (
              <span className="inline-flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                Chưa kích hoạt
              </span>
            ) : progress.percentage === 100 || progress.scheduleStatus === 'completed' ? (
              <span className="inline-flex items-center text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">
                <Award size={14} className="mr-1" /> Hoàn thành
              </span>
            ) : progress.scheduleStatus === 'behind' ? (
              <span className="inline-flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Trễ lộ trình
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                Đúng tiến độ
              </span>
            )}

            {isExpired ? (
              <button
                onClick={() => setIsExtensionOpen(true)}
                className="flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700 hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                <RefreshCw size={14} /> Gia hạn
              </button>
            ) : !isActivated ? (
              <button
                onClick={handleActivateCourse}
                className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                Kích hoạt khóa học
              </button>
            ) : (
              <Link
                to={`/courses/${course.slug}/overview`}
                className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline"
              >
                {progress.percentage === 0 ? 'Bắt đầu học' : 'Tiếp tục học'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
    <CourseExtensionModal
        isOpen={isExtensionOpen}
        onClose={() => setIsExtensionOpen(false)}
        enrollment={enrollment}
      />
    </>
  );
};

export default LearningCourseCard;