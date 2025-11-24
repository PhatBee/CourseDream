import React from 'react';
import { ArrowLeft } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import CourseSidebar from './CourseSidebar'; // Đảm bảo import đúng

const CoursePlayer = ({ course, sections, progress, currentLecture, onBack, onNext, onPrev, onToggleComplete, onSelectLecture }) => {

    const percentage = progress?.percentage || 0;

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            {/* Header Player */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm flex-shrink-0 z-20">
                <div className="flex items-center gap-4 overflow-hidden">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition"
                        title="Quay lại tổng quan"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="border-l border-gray-600 h-6 mx-1 hidden sm:block"></div>
                    <h1 className="font-bold text-sm sm:text-base truncate text-gray-800">{course.title}</h1>
                </div>
            </header>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden min-w-0">

                {/* Main Video */}
                <main className="flex-1 bg-gray-50 flex flex-col min-w-0">
                    <div className="flex-1 overflow-hidden px-4 pt-4 pb-20">
                        <div className="w-full h-full bg-white shadow-sm overflow-hidden">
                            <VideoPlayer
                                lecture={currentLecture}
                                onNext={onNext}
                                onPrevious={onPrev}
                                onToggleComplete={onToggleComplete}
                                isCompleted={progress?.completedLectures?.includes(currentLecture?._id)}
                            />
                        </div>
                    </div>
                </main>

                {/* Sidebar Playlist */}
                <aside className="w-96 flex-shrink-0 border-l border-gray-200 bg-white h-full overflow-y-auto hidden lg:block custom-scrollbar min-w-0">
                    <CourseSidebar
                        sections={sections}
                        completedLectureIds={progress?.completedLectures}
                        currentLectureId={currentLecture?._id}
                        onSelectLecture={onSelectLecture}
                        progressPercentage={percentage}
                    />
                </aside>
            </div>
        </div>
    );
};

export default CoursePlayer;