// src/components/course/CoursePreviewPlayer.jsx
// Component phát video giới thiệu khóa học (preview) trên trang CourseDetail
// Dùng Video.js + CloudFront Signed URL từ backend
import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Play, Loader2, Cloud, AlertCircle } from 'lucide-react';
import { courseApi } from '../../api/courseApi';

const CoursePreviewPlayer = ({ course }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Lấy signed preview URL từ backend khi click play
    const handlePlayPreview = async () => {
        if (previewUrl) {
            setIsPlaying(true);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await courseApi.getCoursePreviewUrl(course.slug);
            const { previewUrl: url } = res.data.data;

            if (!url) {
                setError('Khóa học chưa có video giới thiệu');
                setIsLoading(false);
                return;
            }

            setPreviewUrl(url);
            setIsPlaying(true);
        } catch (err) {
            console.error('[PreviewPlayer] Error:', err);
            // Fallback: nếu course.previewUrl tồn tại thì dùng trực tiếp
            if (course.previewUrl) {
                setPreviewUrl(course.previewUrl);
                setIsPlaying(true);
            } else {
                setError('Không thể tải video. Vui lòng thử lại sau.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Khởi tạo Video.js khi có URL và isPlaying = true
    useEffect(() => {
        if (!isPlaying || !previewUrl || !videoRef.current) return;

        if (!playerRef.current) {
            playerRef.current = videojs(videoRef.current, {
                controls: true,
                autoplay: true,
                preload: 'auto',
                fluid: true,
                responsive: true,
                playbackRates: [0.75, 1, 1.25, 1.5],
                sources: [{ src: previewUrl, type: 'video/mp4' }],
                controlBar: {
                    children: [
                        'playToggle',
                        'volumePanel',
                        'progressControl',
                        'currentTimeDisplay',
                        'timeDivider',
                        'durationDisplay',
                        'playbackRateMenuButton',
                        'fullscreenToggle',
                    ],
                },
            });
        } else {
            playerRef.current.src({ src: previewUrl, type: 'video/mp4' });
            playerRef.current.play();
        }

        return () => {
            // Không dispose ở đây để tránh re-init lại
        };
    }, [isPlaying, previewUrl]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    const hasPreview = course?.previewUrl;

    return (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-black aspect-video">
            {/* Thumbnail layer (hiển thị khi chưa play) */}
            {!isPlaying && (
                <div className="absolute inset-0 z-10">
                    {course?.thumbnail ? (
                        <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-rose-900 via-gray-900 to-gray-800" />
                    )}

                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/40" />

                    {/* Center: Play Button or Error */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {error ? (
                            <div className="text-center px-6">
                                <AlertCircle size={36} className="text-rose-400 mx-auto mb-2" />
                                <p className="text-white/70 text-sm">{error}</p>
                            </div>
                        ) : isLoading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={40} className="text-rose-400 animate-spin" />
                                <p className="text-white/60 text-sm">Đang tải video...</p>
                            </div>
                        ) : hasPreview ? (
                            <button
                                onClick={handlePlayPreview}
                                className="group flex flex-col items-center gap-3"
                            >
                                <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl shadow-rose-900/50 group-hover:scale-110 group-hover:bg-rose-500 transition-all duration-300">
                                    <Play size={26} className="text-white ml-1" />
                                </div>
                                <span className="text-white/90 text-sm font-semibold bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
                                    Xem video giới thiệu
                                </span>
                            </button>
                        ) : (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/20">
                                    <Play size={24} className="text-white/40 ml-1" />
                                </div>
                                <p className="text-white/40 text-sm">Chưa có video giới thiệu</p>
                            </div>
                        )}
                    </div>

                    {/* CloudFront badge (optional)
                    {course?.thumbnail?.includes('cloudfront.net') && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 rounded-full px-2.5 py-1">
                            <Cloud size={11} className="text-blue-400" />
                            <span className="text-white text-xs">AWS CDN</span>
                        </div>
                    )} */}
                </div>
            )}

            {/* Video.js Player (hiển thị khi isPlaying = true) */}
            <div
                data-vjs-player
                className={`w-full h-full transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered w-full h-full"
                />
            </div>
        </div>
    );
};

export default CoursePreviewPlayer;
