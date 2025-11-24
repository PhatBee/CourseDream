import React, { useState } from 'react';
import { PlayCircle, CheckCircle, ChevronDown, ChevronUp, Circle, Clock } from 'lucide-react';
import StarRating from '../common/StarRating';

const OverviewSection = ({ section, progress, onPlayLecture }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
<div className="border border-gray-200 rounded-xl mb-4 overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">      {/* Header của Section */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors group"
      >
        <div>
          <h4 className="font-bold text-gray-800 text-left text-base md:text-lg group-hover:text-rose-600 transition-colors">{section.title}</h4>
          <p className="text-xs text-gray-500 text-left mt-1 font-medium flex items-center gap-1">
            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{section.lectures?.length || 0} bài học</span>
          </p>
        </div>
        <div className={`p-1 rounded-full transition-all ${isOpen ? 'bg-rose-50 text-rose-500' : 'text-gray-400'}`}>
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="divide-y divide-gray-100 border-t border-gray-100 bg-white">
          {section.lectures?.map((lecture) => {
            const isCompleted = progress?.completedLectures?.includes(lecture._id);
            
            return (
              <div key={lecture._id} className="p-4 flex items-center justify-between hover:bg-rose-50/30 transition-colors group">
                <div className="flex items-center gap-4 overflow-hidden">
                  {/* Icon trạng thái */}
                  {isCompleted ? (
                    <CheckCircle className="text-green-500 fill-green-50 shrink-0" size={20} />
                  ) : (
                    <Circle className="text-gray-300 shrink-0 group-hover:text-rose-400 transition-colors" size={20} />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate transition-colors ${isCompleted ? 'text-gray-500' : 'text-gray-800 group-hover:text-rose-600'}`}>
                      {lecture.title}
                    </p>
                    <span className="text-xs text-gray-400 flex items-center mt-1">
                      <Clock size={12} className="mr-1" /> 
                      {lecture.duration ? Math.floor(lecture.duration / 60) : 0} phút
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => onPlayLecture(lecture)}
                  className="ml-4 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <PlayCircle size={14} /> <span className="hidden sm:inline">Học ngay</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CourseOverview = ({ course, progress, onPlayLecture }) => {
  const sections = course?.sections || [];
  const totalLectures = sections.reduce((acc, sec) => acc + (sec.lectures?.length || 0), 0);
  const completedCount = progress?.completedLectures?.length || 0;
  const percentage = progress?.percentage || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        
        {/* === CỘT TRÁI: Scrollable Content === */}
        <div className="lg:col-span-2 pb-10">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold text-gray-900">Nội dung khóa học</h2>
             <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                {totalLectures} bài giảng
             </span>
          </div>
          
          {/* Progress Card - Làm dịu mắt hơn */}
          <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
             <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f43f5e" strokeWidth="4" strokeDasharray={`${percentage}, 100`} className="text-rose-500 transition-all duration-1000 ease-out" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">{percentage}%</span>
             </div>
             <div className="flex-1 w-full">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Tiến độ học tập</p>
                        <p className="text-lg font-bold text-gray-900">Đã xong {completedCount}/{totalLectures} bài</p>
                    </div>
                    {percentage === 100 && <span className="text-green-500 text-sm font-bold flex items-center gap-1"><CheckCircle size={16}/> Hoàn thành</span>}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                </div>
             </div>
          </div>

          {/* Sections List */}
          <div className="space-y-4">
            {sections.map(section => (
                <OverviewSection 
                key={section._id} 
                section={section} 
                progress={progress}
                onPlayLecture={onPlayLecture}
                />
            ))}
          </div>
        </div>

        {/* === CỘT PHẢI: Sticky Sidebar === */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-6 space-y-6">
             {/* Course Info Card */}
             <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-lg shadow-gray-200/50">
                <div className="relative mb-4 rounded-xl overflow-hidden aspect-video shadow-sm group">
                    <img 
                        src={course.thumbnail || "https://via.placeholder.com/300"} 
                        alt={course.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">{course.title}</h3>
                
                <div className="flex items-center gap-3 py-3 border-t border-gray-50 mt-3">
                    <img 
                        src={course.instructor?.avatar || "https://via.placeholder.com/40"} 
                        alt="Instructor" 
                        className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                    />
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Giảng viên</p>
                        <p className="font-bold text-sm text-gray-800">{course.instructor?.name}</p>
                    </div>
                </div>
             </div>

             {/* Action Card */}
             <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center">
                <p className="text-rose-800 font-medium text-sm mb-3">Bạn cảm thấy khóa học thế nào?</p>
                <button className="w-full py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm">
                    <StarRating rating={0} size={16} color="text-yellow-400" /> 
                    <span>Đánh giá ngay</span>
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CourseOverview;