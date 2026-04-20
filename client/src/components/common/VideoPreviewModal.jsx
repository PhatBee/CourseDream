// src/components/common/VideoPreviewModal.jsx
// Preview bài giảng miễn phí (isPreviewFree=true) qua CloudFront Signed URL
// Dùng Video.js giống VideoPlayer và CoursePreviewPlayer — đồng bộ AWS stack.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2, AlertCircle, RefreshCw, Play, Cloud, Lock } from 'lucide-react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { courseApi } from '../../api/courseApi';

// ======================== VIDEO.JS PLAYER (nội bộ modal) ========================
const ModalVideoJSPlayer = ({ src, poster }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);

    useEffect(() => {
        if (!videoRef.current) return;

        // Khởi tạo player
        if (!playerRef.current) {
            playerRef.current = videojs(videoRef.current, {
                controls: true,
                autoplay: true,
                preload: 'auto',
                fluid: true,
                responsive: true,
                poster: poster || '',
                playbackRates: [0.75, 1, 1.25, 1.5, 2],
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
        }

        // Set source
        if (src) {
            playerRef.current.src({ src, type: 'video/mp4' });
            playerRef.current.play().catch(() => { /* autoplay policy */ });
        }

        return () => {
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update src khi thay đổi (không re-init player)
    useEffect(() => {
        if (playerRef.current && src) {
            playerRef.current.src({ src, type: 'video/mp4' });
        }
    }, [src]);

    return (
        <div data-vjs-player className="w-full">
            <video
                crossOrigin="anonymous"
                ref={videoRef}
                className="video-js vjs-big-play-centered w-full"
            />
        </div>
    );
};

// ======================== MAIN MODAL ========================

/**
 * VideoPreviewModal — Xem thử bài giảng miễn phí (isPreviewFree=true)
 *
 * Props:
 *   previewInfo: { lectureId, courseId, lectureTitle, thumbnail } | null
 *   onClose: () => void
 *
 * Luồng: lectureId + courseId → GET /courses/:courseId/lectures/:lectureId/play
 *   → CloudFront Signed URL → Video.js phát
 */
const VideoPreviewModal = ({ previewInfo, onClose }) => {
    const [videoUrl, setVideoUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSignedUrl = useCallback(async () => {
        if (!previewInfo?.lectureId || !previewInfo?.courseId) return;

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);

        try {
            const res = await courseApi.getVideoPlayUrl(previewInfo.courseId, previewInfo.lectureId);
            const { videoUrl: signedUrl } = res.data.data;
            setVideoUrl(signedUrl);
        } catch (err) {
            console.error('[VideoPreviewModal] Failed to get signed URL:', err);
            const status = err?.response?.status;
            if (status === 401) {
                setError('Vui lòng đăng nhập để xem bài giảng này.');
            } else if (status === 403) {
                setError('Bài giảng này không hỗ trợ xem thử.');
            } else {
                setError('Không thể tải video. Vui lòng thử lại sau.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [previewInfo?.lectureId, previewInfo?.courseId]);

    // Fetch khi modal mở
    useEffect(() => {
        if (previewInfo) {
            fetchSignedUrl();
        } else {
            // Reset khi đóng
            setVideoUrl(null);
            setError(null);
            setIsLoading(false);
        }
    }, [fetchSignedUrl, previewInfo]);

    // Đóng khi nhấn Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (previewInfo) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [previewInfo, onClose]);

    // Không render nếu không có previewInfo
    if (!previewInfo) return null;

    const isCFUrl = videoUrl && videoUrl.includes('cloudfront.net');

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-4xl mx-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-900/95 rounded-t-2xl border-b border-white/10">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Play size={14} className="text-white ml-0.5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                                {previewInfo.lectureTitle || 'Xem thử bài giảng'}
                            </p>
                            <p className="text-white/40 text-xs">Bài giảng miễn phí</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0 ml-3"
                    >
                        <X size={16} className="text-white" />
                    </button>
                </div>

                {/* Video Container */}
                <div className="bg-black rounded-b-2xl overflow-hidden shadow-2xl">
                    {isLoading ? (
                        <div
                            className="flex flex-col items-center justify-center bg-gray-950 text-white/60"
                            style={{ aspectRatio: '16/9' }}
                        >
                            <Loader2 size={40} className="animate-spin text-rose-400 mb-3" />
                            <p className="text-sm">Đang tải video từ AWS CloudFront...</p>
                        </div>
                    ) : error ? (
                        <div
                            className="flex flex-col items-center justify-center bg-gray-950 text-white/60"
                            style={{ aspectRatio: '16/9' }}
                        >
                            {error.includes('đăng nhập') || error.includes('không hỗ trợ') ? (
                                <Lock size={40} className="text-rose-400 mb-3" />
                            ) : (
                                <AlertCircle size={40} className="text-rose-400 mb-3" />
                            )}
                            <p className="text-sm text-center px-8 mb-4">{error}</p>
                            {!error.includes('đăng nhập') && !error.includes('không hỗ trợ') && (
                                <button
                                    onClick={fetchSignedUrl}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors"
                                >
                                    <RefreshCw size={14} /> Thử lại
                                </button>
                            )}
                        </div>
                    ) : videoUrl ? (
                        <div className="relative">
                            <ModalVideoJSPlayer
                                src={videoUrl}
                                poster={previewInfo.thumbnail || ''}
                            />
                            {/* CloudFront Badge
                            {isCFUrl && (
                                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 pointer-events-none">
                                    <Cloud size={11} className="text-blue-400" />
                                    <span className="text-white text-xs font-medium">CloudFront CDN</span>
                                </div>
                            )} */}
                        </div>
                    ) : (
                        <div
                            className="flex items-center justify-center bg-gray-950 text-white/30"
                            style={{ aspectRatio: '16/9' }}
                        >
                            <p className="text-sm">Video không khả dụng</p>
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <p className="text-center text-white/30 text-xs mt-3">
                    Nhấn <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/50 font-mono">Esc</kbd> hoặc click bên ngoài để đóng
                </p>
            </div>
        </div>
    );
};

export default VideoPreviewModal;