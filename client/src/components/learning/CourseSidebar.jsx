import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle, CheckCircle, Circle, Lock } from 'lucide-react';

const SectionItem = ({ section, completedLectureIds = [], currentLectureId, onSelectLecture}) => {
  const [isOpen, setIsOpen] = useState(true); 

  return (
    <div className="border-b border-gray-100 last:border-0 bg-white">
      {/* Section Header - Nền trắng, hover xám rất nhạt */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div>
            <h4 className="font-bold text-gray-800 text-sm line-clamp-1 text-left">{section.title}</h4>
            <p className="text-xs text-gray-400 mt-1 text-left font-medium">{section.lectures?.length || 0} bài học</p>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {/* List Lectures */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden"></div>
        {section.lectures?.map((lecture, index) => {
            const isCompleted = completedLectureIds?.includes(lecture._id);
            const isActive = currentLectureId === lecture._id;

            return (
                <div 
                    key={lecture._id}
                    onClick={() => onSelectLecture(lecture)}
                    className={`flex items-start gap-3 p-3 pl-6 cursor-pointer border-l-[3px] transition-all text-left
                        ${isActive 
                            ? 'bg-rose-50 border-rose-500' // Active: Nền hồng nhạt
                            : 'bg-white border-transparent hover:bg-gray-50' // Bình thường: Trắng
                        }
                    `}
                >
                    {/* Checkbox/Status Icon */}
                    <div className="mt-0.5 shrink-0">
                        {isCompleted ? (
                            <CheckCircle size={16} className="text-green-500 fill-green-50" />
                        ) : (
                            isActive ? (
                                <PlayCircle size={16} className="text-rose-500 fill-rose-50" />
                            ) : (
                                <Circle size={16} className="text-gray-300" />
                            )
                        )}
                    </div>

                    <div className="flex-1">
                        <p className={`text-sm font-medium leading-snug ${isActive ? 'text-rose-700' : 'text-gray-600'}`}>
                            {index + 1}. {lecture.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-gray-400 flex items-center font-medium">
                                <PlayCircle size={10} className="mr-1" /> {Math.floor(lecture.duration / 60)} min
                            </span>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

const CourseSidebar = ({ sections = [], completedLectureIds = [], currentLectureId, onSelectLecture, progressPercentage = 0 }) => {
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-sm">
        {/* Header Sidebar: Progress */}
        <div className="p-6 border-b border-gray-100 bg-white">
            <h3 className="font-bold text-gray-900 mb-3 text-left text-base">Nội dung khóa học</h3>
            
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2 font-medium">
                <span className="text-gray-600">Đã hoàn thành: <strong className="text-gray-900">{completedLectureIds?.length}</strong>/{sections.reduce((acc, sec) => acc + sec.lectures.length, 0)} bài</span>
                <span className="text-rose-500 font-bold">{Math.round(progressPercentage)}%</span>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                    className="bg-rose-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            {sections.map((section) => (
                <SectionItem 
                    key={section._id} 
                    section={section} 
                    completedLectureIds={completedLectureIds}
                    currentLectureId={currentLectureId}
                    onSelectLecture={onSelectLecture}
                />
            ))}
        </div>
    </div>
  );
};

export default CourseSidebar;