// src/components/learning/CoursePlayer.jsx
import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import CourseSidebar from './CourseSidebar';

const CoursePlayer = ({
    course,
    sections,
    progress,
    currentLecture,
    onBack,
    onNext,
    onPrev,
    onToggleComplete,
    onSelectLecture
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const percentage = progress?.percentage || 0;
    const completedLectures = progress?.completedLectures || [];
    const isCompleted = completedLectures.includes(currentLecture?._id);

    // Tổng số bài học
    const totalLectures = sections.reduce((acc, s) => acc + (s.lectures?.length || 0), 0);

    return (
        <div className="flex flex-col h-screen bg-gray-900 overflow-hidden font-sans">

            {/* ===== TOP HEADER (Dark Udemy-style) ===== */}
            <header className="flex-shrink-0 h-14 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 z-30">
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onBack}
                        className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                        title="Quay lại trang khóa học"
                    >
                        <ArrowLeft size={19} />
                    </button>
                    <div className="hidden sm:flex items-center gap-2 min-w-0">
                        <div className="w-px h-4 bg-gray-600" />
                        <BookOpen size={15} className="text-rose-400 flex-shrink-0" />
                        <h1 className="text-white font-semibold text-sm truncate max-w-xs">
                            {course.title}
                        </h1>
                    </div>
                </div>

                {/* Center: Progress Bar */}
                <div className="hidden md:flex flex-1 items-center justify-center px-8 max-w-sm mx-auto">
                    <div className="w-full">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{completedLectures.length}/{totalLectures} bài</span>
                            <span className="text-rose-400 font-semibold">{Math.round(percentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                                className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Mobile prev/next */}
                    <div className="flex items-center gap-1 sm:hidden">
                        <button onClick={onPrev} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={onNext} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    {/* Toggle Sidebar */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            sidebarOpen
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                        title={sidebarOpen ? "Ẩn nội dung" : "Hiện nội dung"}
                    >
                        {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
                        <span className="hidden sm:inline">Nội dung</span>
                    </button>
                </div>
            </header>

            {/* ===== BODY ===== */}
            <div className="flex flex-1 overflow-hidden">

                {/* Main area */}
                <main className={`flex-1 overflow-y-auto bg-white transition-all duration-300 ${sidebarOpen ? '' : 'max-w-none'}`}>
                    <VideoPlayer
                        lecture={currentLecture}
                        courseId={course?._id}
                        onNext={onNext}
                        onPrevious={onPrev}
                        onToggleComplete={onToggleComplete}
                        isCompleted={isCompleted}
                    />
                </main>

                {/* Sidebar (Playlist) */}
                {sidebarOpen && (
                    <aside className="w-80 xl:w-96 flex-shrink-0 border-l border-gray-200 bg-white hidden lg:flex flex-col overflow-hidden">
                        <CourseSidebar
                            sections={sections}
                            completedLectureIds={completedLectures}
                            currentLectureId={currentLecture?._id}
                            onSelectLecture={onSelectLecture}
                            progressPercentage={percentage}
                        />
                    </aside>
                )}
            </div>

            {/* ===== MOBILE SIDEBAR (Bottom Drawer) ===== */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setSidebarOpen(false)}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative bg-white rounded-t-2xl max-h-[70vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 text-sm">Nội dung khóa học</h3>
                            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <CourseSidebar
                                sections={sections}
                                completedLectureIds={completedLectures}
                                currentLectureId={currentLecture?._id}
                                onSelectLecture={(lec) => {
                                    onSelectLecture(lec);
                                    setSidebarOpen(false);
                                }}
                                progressPercentage={percentage}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursePlayer;