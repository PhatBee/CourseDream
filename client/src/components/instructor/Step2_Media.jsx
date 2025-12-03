import React from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import VideoInputSelector from '../common/VideoInputSelector';

const Step2_Media = ({ courseData, setCourseData, handleThumbnailUpload }) => {
    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Course Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Thumbnail Upload */}
                <div>
                    <label className="block text-sm font-bold mb-2">Course Thumbnail <span className="text-red-500">*</span></label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden group hover:border-blue-400 transition cursor-pointer">
                        {courseData.thumbnailPreview ? (
                            <>
                                <img src={courseData.thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Ngăn click vào input file
                                        setCourseData(p => ({ ...p, thumbnail: null, thumbnailPreview: '' }));
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <ImageIcon size={48} className="text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">Click to upload image</p>
                                <p className="text-xs text-gray-400 mt-1">(jpg, png, webp)</p>
                            </>
                        )}
                        <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>

                {/* Preview Video Selector */}
                <div>
                    <label className="block text-sm font-bold mb-2">Course Intro Video (Optional)</label>
                    <VideoInputSelector
                        type={courseData.previewVideoType}
                        urlValue={courseData.previewVideoUrl}
                        onTypeChange={(t) => setCourseData(p => ({ ...p, previewVideoType: t }))}
                        onUrlChange={(v) => setCourseData(p => ({ ...p, previewVideoUrl: v }))}
                        onFileChange={(e) => setCourseData(p => ({ ...p, previewVideoFile: e.target.files[0] }))}
                    />
                </div>
            </div>
        </div>
    );
};

export default Step2_Media;