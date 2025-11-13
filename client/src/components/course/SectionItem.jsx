// src/components/course/SectionItem.js
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle, Lock } from 'lucide-react';
import LectureItem from './LectureItem';

const SectionItem = ({ section, onPreviewClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const totalLectures = section.lectures?.length || 0;

  return (
    <div className="border border-gray-200 rounded-md">
      {/* Header của Section */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100"
      >
        <div className="text-left">
          <h6 className="font-semibold text-gray-800">{section.title}</h6>
          <span className="text-sm text-gray-500">{totalLectures} lectures</span>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Danh sách bài giảng (khi mở) */}
      {isOpen && (
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-100">
            {section.lectures?.map((lecture) => (
              <LectureItem 
                key={lecture._id} 
                lecture={lecture} 
                onPreviewClick={onPreviewClick} // <-- Truyền xuống đây
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SectionItem;