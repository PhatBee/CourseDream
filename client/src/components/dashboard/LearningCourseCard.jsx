import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Award } from 'lucide-react';
import ProgressBar from '../common/ProgressBar';

const LearningCourseCard = ({ enrollment }) => {
  const { course, learningProgress } = enrollment;

  if (!course) return null;

  const progress = learningProgress;

  return (
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
            {progress.percentage === 100 ? (
              <span className="inline-flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                <Award size={14} className="mr-1" /> Đã Hoàn thành
              </span>
            ) : (
              <span className="text-xs text-gray-400">Tiếp tục nào!</span>
            )}

            <Link
              to={`/courses/${course.slug}/overview`}
              className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              {progress.percentage === 0 ? 'Bắt đầu học' : 'Tiếp tục học'} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningCourseCard;