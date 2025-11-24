// src/components/course/CourseAccordion.js
import React, { useState } from 'react';
import SectionItem from './SectionItem';
import VideoPreviewModal from '../common/VideoPreviewModal';

const CourseAccordion = ({ sections = [] }) => {
    const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
    const totalLectures = sections.reduce((acc, sec) => acc + (sec.lectures?.length || 0), 0);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h5 className="text-xl font-semibold text-gray-800">Course Content</h5>
                <span className="text-sm text-gray-500">
                    {sections.length} sections • {totalLectures} lectures
                </span>
            </div>

            <div className="space-y-3">
                {sections.map((section) => (
                    <SectionItem
                        key={section._id}
                        section={section}
                        onPreviewClick={setPreviewVideoUrl}
                    />
                ))}
            </div>

            <VideoPreviewModal
                videoUrl={previewVideoUrl}
                onClose={() => setPreviewVideoUrl(null)}
            />
        </div>
    );
};

export default CourseAccordion;