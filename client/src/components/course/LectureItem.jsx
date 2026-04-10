// src/components/course/LectureItem.jsx
import React from 'react';
import { PlayCircle, Lock } from 'lucide-react';

// Format thời gian (giây → mm:ss hoặc hh:mm:ss)
const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const mm = minutes.toString().padStart(2, '0');
    const ss = remainingSeconds.toString().padStart(2, '0');

    if (hours > 0) {
        const hh = hours.toString().padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
};

/**
 * LectureItem — Hiển thị 1 bài giảng trong accordion trang chi tiết khóa học.
 *
 * Props:
 *   lecture    : object (từ API getCourseDetailsBySlug)
 *   courseId   : string — MongoDB _id của Course (dùng để gọi API Signed URL)
 *   onPreviewClick : (info: { lectureId, courseId, lectureTitle, thumbnail }) => void
 */
const LectureItem = ({ lecture, courseId, onPreviewClick }) => {
    const { _id, title, duration = 0, isPreviewFree = false } = lecture;

    const handlePreview = () => {
        if (!isPreviewFree || !onPreviewClick) return;
        onPreviewClick({
            lectureId: _id,
            courseId,
            lectureTitle: title,
            thumbnail: lecture.thumbnail || '',
        });
    };

    return (
        <li className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors group">
            {/* Icon + Title */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {isPreviewFree ? (
                    <PlayCircle
                        size={17}
                        className="text-rose-500 flex-shrink-0"
                    />
                ) : (
                    <Lock
                        size={16}
                        className="text-gray-350 flex-shrink-0"
                    />
                )}
                <span className={`text-sm truncate ${isPreviewFree ? 'text-gray-800' : 'text-gray-600'}`}>
                    {title}
                </span>
            </div>

            {/* Right side: Preview link + Duration */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {isPreviewFree && (
                    <button
                        onClick={handlePreview}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline underline-offset-2 transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                        <PlayCircle size={13} />
                        Xem thử
                    </button>
                )}
                {duration > 0 && (
                    <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
                        {formatDuration(duration)}
                    </span>
                )}
            </div>
        </li>
    );
};

export default LectureItem;