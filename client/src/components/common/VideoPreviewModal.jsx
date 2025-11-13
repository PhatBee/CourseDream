// src/components/common/VideoPreviewModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import { getEmbedUrl } from '../../utils/videoUtils';

const VideoPreviewModal = ({ videoUrl, onClose }) => {
  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) {
    return null;
  }

  // 2. Render Modal
  return (
    // Lớp phủ (Overlay)
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose} // Bấm ra ngoài để tắt
    >
      <div 
        className="relative w-full max-w-4xl p-4"
        onClick={(e) => e.stopPropagation()} // Ngăn bấm vào video bị tắt
      >
        
        {/* Nút đóng (X) */}
        <button 
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg"
        >
          <X size={24} />
        </button>

        {/* Khung chứa video (Responsive) */}
        <div className="aspect-video w-full bg-black">
          <iframe 
            src={embedUrl} // Dùng link động
            style={{ width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            title="Dailymotion Video Player"
            allow="web-share; autoplay"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewModal;