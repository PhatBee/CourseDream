// src/components/course/LectureItem.js
import React from 'react';
import { PlayCircle, Lock } from 'lucide-react';

// Hàm format thời gian (giây -> hh:mm:ss)
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  // Sử dụng padStart để đảm bảo mm và ss luôn có 2 chữ số
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  if (hours > 0) {
    // Nếu lớn hơn 1 giờ, hiển thị HH:mm:ss
    const formattedHours = hours.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  } else {
    // Nếu ít hơn 1 giờ, chỉ hiển thị mm:ss
    return `${formattedMinutes}:${formattedSeconds}`;
  }
};

const LectureItem = ({ lecture, onPreviewClick }) => {
  const { title, duration = 0, isPreviewFree = false, videoUrl = '' } = lecture;

  return (
    <li className="p-4 flex justify-between items-center">
      <div className="flex items-center">
        {isPreviewFree ? (
          <PlayCircle size={18} className="text-gray-600 mr-2" />
        ) : (
          <Lock size={18} className="text-gray-400 mr-2" />
        )}
        <p className="text-sm text-gray-700">{title}</p>
      </div>
      
      <div className="flex items-center gap-4">
        {isPreviewFree ? (
          <a 
            onClick={() => onPreviewClick(videoUrl)}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Preview
          </a>
        ) : (
          null 
        )}
        <span className="text-sm text-gray-500">{formatDuration(duration)}</span>
      </div>
    </li>
  );
};

export default LectureItem;