// src/components/course/CourseAccordion.jsx
import React, { useState } from 'react';
import { BookOpen, Clock } from 'lucide-react';
import SectionItem from './SectionItem';
import VideoPreviewModal from '../common/VideoPreviewModal';

/**
 * CourseAccordion — Hiển thị nội dung chương trình học (sections/lectures).
 * Tích hợp VideoPreviewModal dùng CloudFront Signed URL (AWS).
 *
 * Props:
 *   sections  : array
 *   courseId  : string — MongoDB _id của Course (bắt buộc để lấy Signed URL)
 */
const CourseAccordion = ({ sections = [], courseId }) => {
    // previewInfo: { lectureId, courseId, lectureTitle, thumbnail } | null
    const [previewInfo, setPreviewInfo] = useState(null);

    const totalLectures = sections.reduce((acc, sec) => acc + (sec.lectures?.length || 0), 0);
    const freeTotal = sections.reduce(
        (acc, sec) => acc + (sec.lectures?.filter(l => l.isPreviewFree)?.length || 0), 0
    );

    // Tổng thời gian tất cả lectures (giây)
    const totalSeconds = sections.reduce(
        (acc, sec) => acc + (sec.lectures || []).reduce((a, l) => a + (l.duration || 0), 0),
        0
    );
    const totalHours = (totalSeconds / 3600).toFixed(1);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                <h5 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen size={20} className="text-rose-500" />
                    Nội dung khóa học
                </h5>
                <div className="flex flex-col items-end gap-0.5">
                    <span className="text-sm text-gray-500">
                        {sections.length} chương • {totalLectures} bài giảng
                    </span>
                    <div className="flex items-center gap-3">
                        {parseFloat(totalHours) > 0 && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={11} /> {totalHours} giờ học
                            </span>
                        )}
                        {freeTotal > 0 && (
                            <span className="text-xs text-rose-500 font-medium">
                                {freeTotal} bài xem thử miễn phí
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Section list */}
            <div className="space-y-2">
                {sections.map((section) => (
                    <SectionItem
                        key={section._id}
                        section={section}
                        courseId={courseId}
                        onPreviewClick={setPreviewInfo}
                    />
                ))}
            </div>

            {/* Video Preview Modal (AWS CloudFront Signed URL) */}
            <VideoPreviewModal
                previewInfo={previewInfo}
                onClose={() => setPreviewInfo(null)}
            />
        </div>
    );
};

export default CourseAccordion;