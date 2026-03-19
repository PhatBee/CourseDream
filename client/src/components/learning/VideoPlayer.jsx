// src/components/learning/VideoPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import {
    ChevronLeft, ChevronRight, CheckCircle, Download, File,
    Link as LinkIcon, Cloud, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import { courseApi } from '../../api/courseApi';

// ======================== VIDEO.JS PLAYER ========================

const VideoJSPlayer = ({ src, poster, onReady, onTimeUpdate, onEnded }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);

    useEffect(() => {
        // Khởi tạo Video.js player
        if (!playerRef.current && videoRef.current) {
            playerRef.current = videojs(videoRef.current, {
                controls: true,
                autoplay: false,
                preload: 'metadata',
                fluid: true,
                responsive: true,
                poster: poster || '',
                playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
                controlBar: {
                    children: [
                        'playToggle',
                        'skipBackward',
                        'skipForward',
                        'volumePanel',
                        'currentTimeDisplay',
                        'timeDivider',
                        'durationDisplay',
                        'progressControl',
                        'playbackRateMenuButton',
                        'fullscreenToggle',
                    ],
                    skipButtons: { forward: 10, backward: 10 },
                },
                html5: {
                    vhs: {
                        overrideNative: true,
                        enableLowInitialPlaylist: true,
                    },
                },
            });

            playerRef.current.on('ready', () => {
                if (onReady) onReady(playerRef.current);
            });

            playerRef.current.on('timeupdate', () => {
                if (onTimeUpdate) {
                    onTimeUpdate(playerRef.current.currentTime());
                }
            });

            playerRef.current.on('ended', () => {
                if (onEnded) onEnded();
            });
        }

        return () => {
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    // Cập nhật src khi lecture thay đổi
    useEffect(() => {
        if (playerRef.current && src) {
            playerRef.current.src({ src, type: 'video/mp4' });
            if (poster) playerRef.current.poster(poster);
        }
    }, [src]);

    return (
        <div data-vjs-player className="w-full h-full">
            <video crossorigin="anonymous"
                ref={videoRef}
                className="video-js vjs-big-play-centered vjs-theme-custom w-full h-full"
            />
        </div>
    );
};

// ======================== RESOURCE ITEM ========================

const ResourceItem = ({ resource }) => {
    const isLink = resource.type === 'link';
    return (
        <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-rose-200 hover:shadow-sm transition-all group"
        >
            <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                {isLink ? <LinkIcon size={16} className="text-rose-500" /> : <File size={16} className="text-rose-500" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate group-hover:text-rose-600 transition-colors">
                    {resource.title || 'Untitled'}
                </p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                    {isLink ? 'External Link' : 'File Download'}
                </p>
            </div>
            <Download size={14} className="text-gray-300 group-hover:text-rose-400 transition-colors flex-shrink-0" />
        </a>
    );
};

// ======================== MAIN VIDEO PLAYER ========================

const VideoPlayer = ({ lecture, courseId, onNext, onPrevious, onToggleComplete, isCompleted }) => {
    const [videoUrl, setVideoUrl] = useState(null);
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [urlError, setUrlError] = useState(null);

    // Fetch CloudFront Signed URL khi lecture thay đổi
    const fetchVideoUrl = useCallback(async () => {
        if (!lecture?._id || !courseId) return;

        setIsLoadingUrl(true);
        setUrlError(null);
        setVideoUrl(null);

        try {
            const res = await courseApi.getVideoPlayUrl(courseId, lecture._id);
            const { videoUrl: signedUrl } = res.data.data;
            setVideoUrl(signedUrl);
        } catch (err) {
            console.error('[VideoPlayer] Failed to get signed URL:', err);
            // Fallback: nếu lecture.videoUrl là CDN URL thì dùng trực tiếp
            if (lecture.videoUrl) {
                setVideoUrl(lecture.videoUrl);
            } else {
                setUrlError('Không thể tải video. Vui lòng thử lại.');
            }
        } finally {
            setIsLoadingUrl(false);
        }
    }, [lecture?._id, courseId]);

    useEffect(() => {
        fetchVideoUrl();
    }, [fetchVideoUrl]);

    // Parse resources
    const parsedResources = React.useMemo(() => {
        if (!lecture?.resources || !Array.isArray(lecture.resources)) return [];
        return lecture.resources.filter(Boolean).map(r => {
            if (typeof r === 'object') return r;
            try { return JSON.parse(r); } catch { return null; }
        }).filter(Boolean);
    }, [lecture?.resources]);

    const formatDuration = (seconds) => {
        if (!seconds) return '';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    if (!lecture) {
        return (
            <div className="flex flex-col items-center justify-center aspect-video bg-gray-900 rounded-none text-gray-400">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
                    <Cloud size={28} className="text-gray-600" />
                </div>
                <p className="text-sm font-medium">Chọn bài giảng để bắt đầu</p>
            </div>
        );
    }

    const isCFUrl = videoUrl && videoUrl.includes('cloudfront.net');

    return (
        <div className="flex flex-col bg-white h-full overflow-y-auto">

            {/* ===== VIDEO PLAYER SECTION ===== */}
            <div className="relative w-full bg-black" style={{ minHeight: '240px' }}>
                {isLoadingUrl ? (
                    <div className="aspect-video flex flex-col items-center justify-center text-white/60">
                        <Loader2 size={36} className="animate-spin text-rose-400 mb-3" />
                        <p className="text-sm">Đang tải video từ AWS CloudFront...</p>
                    </div>
                ) : urlError ? (
                    <div className="aspect-video flex flex-col items-center justify-center text-white/60">
                        <AlertCircle size={36} className="text-rose-400 mb-3" />
                        <p className="text-sm text-center px-4">{urlError}</p>
                        <button
                            onClick={fetchVideoUrl}
                            className="mt-3 flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600 transition-colors"
                        >
                            <RefreshCw size={14} /> Thử lại
                        </button>
                    </div>
                ) : videoUrl ? (
                    <>
                        <VideoJSPlayer
                            src={videoUrl}
                            poster={lecture.thumbnail || ''}
                            onEnded={() => {
                                if (!isCompleted) onToggleComplete?.();
                            }}
                        />
                        {/* CloudFront badge */}
                        {isCFUrl && (
                            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/60 rounded-full px-2.5 py-1 pointer-events-none">
                                <Cloud size={11} className="text-blue-400" />
                                <span className="text-white text-xs font-medium">CloudFront CDN</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="aspect-video flex flex-col items-center justify-center text-white/40">
                        <p className="text-sm">Video không khả dụng</p>
                    </div>
                )}
            </div>

            {/* ===== CONTENT BELOW VIDEO ===== */}
            <div className="flex-1 px-6 py-5">

                {/* Title & Navigation */}
                <div className="mb-5">
                    <h1 className="text-xl font-bold text-gray-900 leading-snug mb-1">{lecture.title}</h1>
                    {lecture.duration > 0 && (
                        <p className="text-sm text-gray-400">⏱ {formatDuration(lecture.duration)}</p>
                    )}
                </div>

                {/* Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-gray-100">
                    <div className="flex gap-2">
                        <button
                            onClick={onPrevious}
                            className="flex items-center gap-1.5 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl font-medium hover:border-rose-400 hover:text-rose-600 transition-all text-sm shadow-sm"
                        >
                            <ChevronLeft size={16} /> Bài trước
                        </button>
                        <button
                            onClick={onNext}
                            className="flex items-center gap-1.5 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl font-medium hover:border-rose-400 hover:text-rose-600 transition-all text-sm shadow-sm"
                        >
                            Bài tiếp <ChevronRight size={16} />
                        </button>
                    </div>

                    <button
                        onClick={onToggleComplete}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all border shadow-sm ${isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700 shadow-rose-200'
                            }`}
                    >
                        <CheckCircle size={16} className={isCompleted ? 'text-emerald-600' : 'text-white'} />
                        {isCompleted ? 'Đã hoàn thành' : 'Hoàn thành bài học'}
                    </button>
                </div>

                {/* Resources */}
                {parsedResources.length > 0 && (
                    <div className="mt-5">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Download size={15} className="text-rose-500" />
                            Tài liệu đính kèm ({parsedResources.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {parsedResources.map((res, idx) => (
                                <ResourceItem key={idx} resource={res} />
                            ))}
                        </div>
                    </div>
                )}

                {/* AWS Info Chip */}
                {isCFUrl && (
                    <div className="mt-5 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2.5">
                        <Cloud size={13} className="text-blue-400" />
                        <span>Video được phân phối qua <strong className="text-gray-600">AWS CloudFront CDN</strong> — bảo mật và tốc độ cao.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;