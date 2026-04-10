// src/components/course/SectionItem.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import LectureItem from './LectureItem';

/**
 * SectionItem — Accordion section trong trang CourseDetail.
 *
 * Props:
 *   section        : object
 *   courseId       : string — truyền xuống LectureItem để lấy Signed URL
 *   onPreviewClick : (previewInfo) => void
 */
const SectionItem = ({ section, courseId, onPreviewClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const totalLectures = section.lectures?.length || 0;
    const freeCount = section.lectures?.filter(l => l.isPreviewFree)?.length || 0;

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Section Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <div>
                    <h6 className="font-semibold text-gray-800 text-sm leading-snug">{section.title}</h6>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{totalLectures} bài giảng</span>
                        {freeCount > 0 && (
                            <span className="text-xs text-rose-500 font-medium">
                                • {freeCount} xem thử miễn phí
                            </span>
                        )}
                    </div>
                </div>
                {isOpen
                    ? <ChevronUp size={18} className="text-gray-500 flex-shrink-0" />
                    : <ChevronDown size={18} className="text-gray-500 flex-shrink-0" />
                }
            </button>

            {/* Lecture List */}
            {isOpen && (
                <div className="border-t border-gray-200 bg-white">
                    <ul className="divide-y divide-gray-100">
                        {section.lectures?.map((lecture) => (
                            <LectureItem
                                key={lecture._id}
                                lecture={lecture}
                                courseId={courseId}
                                onPreviewClick={onPreviewClick}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SectionItem;