import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Play } from 'lucide-react';
import { getEmbedUrl } from '../../utils/videoUtils';

const VideoPlayer = ({ lecture, onNext, onPrevious, onToggleComplete, isCompleted }) => {
    const embedSrc = useMemo(() => {
        if (!lecture?.videoUrl) return "";
        return getEmbedUrl(lecture.videoUrl);
    }, [lecture?.videoUrl]);

    if (!lecture) return (
        <div className="aspect-video bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
            <Play size={48} className="mb-2 opacity-20" />
            <span className="font-medium">Chọn một bài học để bắt đầu</span>
        </div>
    );

    return (
    <div className="flex flex-col h-full bg-white">
      {/* Video Container */}
      <div className="relative w-full aspect-video bg-black overflow-hidden shadow-sm border-gray-100">
        {embedSrc ? (
            <iframe 
                src={embedSrc} 
                title={lecture.title}
                className="w-full h-full object-cover"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
            ></iframe>
        ) : (
            // Fallback khi link lỗi: Nền tối nhẹ để dễ nhìn text
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-100">
                <p>Video không khả dụng</p>
            </div>
        )}
      </div>

      {/* Controls & Title - Căn trái */}
      <div className="mt-6 mb-8">
        <div className="flex flex-col gap-4">
            {/* Tiêu đề to, căn trái */}
            <h1 className="text-2xl font-bold text-gray-900 text-left">{lecture.title}</h1>
            
            {/* Thanh điều hướng */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <div className="flex gap-3">
                    <button 
                        onClick={onPrevious}
                        className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg font-medium hover:border-rose-500 hover:text-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={18} className="mr-1" /> Bài trước
                    </button>
                    <button 
                        onClick={onNext}
                        className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg font-medium hover:border-rose-500 hover:text-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Bài tiếp <ChevronRight size={18} className="ml-1" />
                    </button>
                </div>

                <button 
                    onClick={onToggleComplete}
                    className={`flex items-center px-5 py-2 rounded-lg font-semibold transition-all border shadow-sm
                        ${isCompleted 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                            : 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'}`}
                >
                    <CheckCircle size={18} className={`mr-2 ${isCompleted ? 'text-green-600' : 'text-white'}`} />
                    {isCompleted ? 'Đã hoàn thành' : 'Hoàn thành bài học'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;