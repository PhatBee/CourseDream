// src/components/learning/CoursePlayer.jsx
import React, { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import CourseSidebar from "./CourseSidebar";

const CoursePlayer = ({
  course,
  sections,
  progress,
  currentLecture,
  lastWatchedTime,
  onBack,
  onNext,
  onPrev,
  onToggleComplete,
  onSelectLecture,
  onVideoProgress,
  user,
  isEnrolled,
  isInstructor,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const percentage = progress?.percentage || 0;
  const completedLectures = progress?.completedLectures || [];
  const isCompleted = completedLectures.includes(currentLecture?._id);
  const totalLectures = sections.reduce(
    (acc, s) => acc + (s.lectures?.length || 0),
    0,
  );

  return (
    /*
     * Root: flex-col, full viewport height, no overflow on root.
     * Header: flex-shrink-0 (không co giãn).
     * Body:   flex-1 overflow-hidden → chứa main + sidebar.
     * Main:   overflow-y-auto → người dùng scroll nội dung bên dưới video.
     * Sidebar: overflow-y-auto riêng bên trong.
     */
    <div
      className="learning-page-root flex flex-col bg-[#1c1d1f]"
      style={{ height: "100dvh" }}
    >
      {/* ===== HEADER ===== */}
      <header className="flex-shrink-0 h-14 bg-[#1c1d1f] border-b border-[#3e4143] flex items-center justify-between px-4 z-30">
        {/* Left: Back + Course Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Quay lại trang khóa học"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-px h-4 bg-[#3e4143]" />
            <BookOpen size={15} className="text-rose-400 flex-shrink-0" />
            <h1 className="text-white font-semibold text-sm truncate max-w-[160px] sm:max-w-xs lg:max-w-sm">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Center: Progress */}
        <div className="hidden md:flex flex-1 items-center justify-center px-8 max-w-sm mx-auto">
          <div className="w-full">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>
                {completedLectures.length}/{totalLectures} bài
              </span>
              <span className="text-rose-400 font-semibold">
                {Math.round(percentage)}%
              </span>
            </div>
            <div className="w-full bg-[#3e4143] rounded-full h-1.5">
              <div
                className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile: prev/next */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              onClick={onPrev}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={onNext}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Toggle Sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sidebarOpen
                ? "bg-white/15 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
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
        {/* ---- MAIN CONTENT: video + info bên dưới ---- */}
        <main className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          <VideoPlayer
            lecture={currentLecture}
            courseId={course?._id}
            lastWatchedTime={lastWatchedTime}
            onNext={onNext}
            onPrevious={onPrev}
            onToggleComplete={onToggleComplete}
            onVideoProgress={onVideoProgress}
            isCompleted={isCompleted}
            user={user}
            isEnrolled={isEnrolled}
            isInstructor={isInstructor}
          />
        </main>

        {/* ---- SIDEBAR (Desktop) ---- */}
        {sidebarOpen && (
          <aside className="w-80 xl:w-96 flex-shrink-0 border-l border-[#3e4143] bg-white hidden lg:flex flex-col overflow-hidden transition-all duration-300">
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
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-t-2xl max-h-[75vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">
                Nội dung khóa học
              </h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
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
