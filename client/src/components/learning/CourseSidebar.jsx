// src/components/learning/CourseSidebar.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle, CheckCircle, Circle, Clock } from 'lucide-react';

const formatDuration = (seconds) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

const SectionItem = ({ section, sIdx, completedLectureIds = [], currentLectureId, onSelectLecture }) => {
    const [isOpen, setIsOpen] = useState(true);

    const completedInSection = (section.lectures || []).filter(l =>
        completedLectureIds.includes(l._id)
    ).length;
    const totalInSection = section.lectures?.length || 0;
    const sectionDuration = (section.lectures || []).reduce((a, l) => a + (l.duration || 0), 0);
    const isAllDone = completedInSection === totalInSection && totalInSection > 0;

    return (
        <div className="border-b border-gray-100 last:border-0">
            {/* Section Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-start gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                            Section {sIdx + 1}
                        </span>
                        {isAllDone && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-semibold rounded">
                                Hoàn thành
                            </span>
                        )}
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{section.title}</h4>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                        <span>{completedInSection}/{totalInSection} bài</span>
                        {sectionDuration > 0 && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                    <Clock size={10} /> {Math.floor(sectionDuration / 60)} phút
                                </span>
                            </>
                        )}
                    </div>
                </div>
                {isOpen
                    ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />}
            </button>

            {/* Lecture List */}
            {isOpen && (
                <div>
                    {(section.lectures || []).map((lecture, lIdx) => {
                        const isCompleted = completedLectureIds.includes(lecture._id);
                        const isActive = currentLectureId === lecture._id;

                        return (
                            <div
                                key={lecture._id}
                                onClick={() => onSelectLecture(lecture)}
                                className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-l-[3px] transition-all group ${
                                    isActive
                                        ? 'bg-rose-50 border-rose-500'
                                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                }`}
                            >
                                {/* Status Icon */}
                                <div className="flex-shrink-0 mt-0.5">
                                    {isCompleted ? (
                                        <CheckCircle size={16} className="text-emerald-500" />
                                    ) : isActive ? (
                                        <PlayCircle size={16} className="text-rose-500" />
                                    ) : (
                                        <Circle size={16} className="text-gray-300" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-snug font-medium line-clamp-2 ${
                                        isActive ? 'text-rose-700' : 'text-gray-700 group-hover:text-gray-900'
                                    }`}>
                                        {lIdx + 1}. {lecture.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {lecture.duration > 0 && (
                                            <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                                <Clock size={10} /> {formatDuration(lecture.duration)}
                                            </span>
                                        )}
                                        {lecture.isPreviewFree && !isActive && (
                                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded border border-amber-200">
                                                Preview
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const CourseSidebar = ({
    sections = [],
    completedLectureIds = [],
    currentLectureId,
    onSelectLecture,
    progressPercentage = 0
}) => {
    const totalLectures = sections.reduce((acc, s) => acc + (s.lectures?.length || 0), 0);
    const completed = completedLectureIds?.length || 0;

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header / Progress */}
            <div className="flex-shrink-0 p-4 border-b border-gray-100 bg-white">
                <h3 className="font-bold text-gray-900 text-sm mb-3">Nội dung khóa học</h3>

                {/* Progress Stats */}
                <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-500">
                        <span className="font-bold text-gray-800">{completed}</span>/{totalLectures} bài hoàn thành
                    </span>
                    <span className="font-bold text-rose-500">{Math.round(progressPercentage)}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-rose-500 to-rose-400 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Section List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {sections.map((section, sIdx) => (
                    <SectionItem
                        key={section._id}
                        section={section}
                        sIdx={sIdx}
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