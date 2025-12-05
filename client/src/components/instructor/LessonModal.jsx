import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Upload, FileText } from 'lucide-react';
import VideoInputSelector from '../common/VideoInputSelector';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const LessonModal = ({ isOpen, onClose, onSave, initialData, isEditing }) => {
    const [lesson, setLesson] = useState({
        title: '',
        videoType: 'url',
        videoUrl: '',
        videoFile: null,
        duration: 0,
        isPreviewFree: false,
        resources: []
    });

    // Resource State
    const [resourceType, setResourceType] = useState('link'); // 'link' | 'upload'
    const [tempResource, setTempResource] = useState({ title: '', url: '' });
    const [uploadFile, setUploadFile] = useState(null); // File đang chọn

    useEffect(() => {
        if (initialData) {
            // Nếu đang edit, fill dữ liệu cũ (nhớ reset videoFile để tránh lỗi)
            setLesson({ ...initialData, videoFile: null });
        } else {
            // Reset form nếu add new
            setLesson({
                title: '',
                videoType: 'url',
                videoUrl: '',
                videoFile: null,
                duration: 0,
                isPreviewFree: false,
                resources: []
            });
        }
        // Reset inputs
        setTempResource({ title: '', url: '' });
        setUploadFile(null);
        setResourceType('link');
    }, [initialData, isOpen]);

    // --- XỬ LÝ RESOURCE (LOGIC MỚI: CHỈ LƯU LOCAL) ---

    const handleAddResource = () => {
        if (!tempResource.title) return toast.error("Vui lòng nhập Title Resource");

        let newResource = {
            title: tempResource.title,
            type: resourceType
        };

        // TRƯỜNG HỢP 1: UPLOAD FILE -> Lưu file object, chưa có URL
        if (resourceType === 'upload') {
            if (!uploadFile) return toast.error("Vui lòng chọn file để upload");

            newResource.file = uploadFile; // Lưu file gốc
            newResource.url = ""; // Chưa có URL
            newResource.type = 'file';
        }
        // TRƯỜNG HỢP 2: LINK -> Lưu URL bình thường
        else {
            if (!tempResource.url) return toast.error("Vui lòng nhập URL Resource");
            newResource.url = tempResource.url;
        }

        // Thêm vào list
        setLesson(prev => ({
            ...prev,
            resources: [...prev.resources, newResource]
        }));

        // Reset inputs
        setTempResource({ title: '', url: '' });
        setUploadFile(null);
        toast.success("Resource added to queue");
    };

    const handleSave = () => {
        if (!lesson.title.trim()) return toast.error("Lesson title is required");
        onSave(lesson);
    };

    const addResource = () => {
        if (!tempResource.title || !tempResource.url) return toast.error("Resource needs Title and URL");
        setLesson(prev => ({
            ...prev,
            resources: [...prev.resources, { ...tempResource, type: 'link' }]
        }));
        setTempResource({ title: '', url: '' });
    };

    const removeResource = (index) => {
        setLesson(prev => ({
            ...prev,
            resources: prev.resources.filter((_, i) => i !== index)
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">
                        {isEditing ? 'Edit Lesson' : 'Add New Lesson'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Lesson Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Introduction to React"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-700">Lesson Content (Video)</label>
                        <VideoInputSelector
                            type={lesson.videoType}
                            urlValue={lesson.videoUrl}
                            onTypeChange={(t) => setLesson({ ...lesson, videoType: t })}
                            onUrlChange={(v) => setLesson({ ...lesson, videoUrl: v })}
                            onFileChange={(e) => setLesson({ ...lesson, videoFile: e.target.files[0] })}
                        />
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-1">
                            <label className="block text-sm font-bold mb-1 text-gray-700">Duration (seconds)</label>
                            <input
                                type="number"
                                min="0"
                                value={lesson.duration}
                                onChange={(e) => setLesson({ ...lesson, duration: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-1 flex items-center pt-6">
                            <input
                                type="checkbox"
                                id="isPreviewFree"
                                checked={lesson.isPreviewFree}
                                onChange={(e) => setLesson({ ...lesson, isPreviewFree: e.target.checked })}
                                className="w-5 h-5 text-blue-600 rounded mr-2 cursor-pointer"
                            />
                            <label htmlFor="isPreviewFree" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                Enable Free Preview
                            </label>
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div className="border-t pt-4">
                        <label className="block text-sm font-bold mb-2 text-gray-700">Downloadable Resources</label>

                        <div className="bg-gray-50 p-4 rounded-lg border mb-3">

                            {/* Tabs Switcher */}
                            <div className="flex gap-4 mb-3 border-b border-gray-200 pb-2">
                                <button onClick={() => setResourceType('link')} className={`text-sm font-medium flex items-center gap-1 pb-1 transition-colors ${resourceType === 'link' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                                    <LinkIcon size={14} /> External Link
                                </button>
                                <button onClick={() => setResourceType('upload')} className={`text-sm font-medium flex items-center gap-1 pb-1 transition-colors ${resourceType === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                                    <Upload size={14} /> Upload File
                                </button>
                            </div>

                            {/* Input Fields */}
                            <div className="flex gap-2 items-end">
                                <div className="flex-1 space-y-2">
                                    <input type="text" placeholder="Resource Title (e.g. Exercise PDF)" className="w-full px-3 py-1.5 border rounded text-sm focus:outline-blue-500" value={tempResource.title} onChange={(e) => setTempResource({ ...tempResource, title: e.target.value })} />

                                    {resourceType === 'link' ? (
                                        <input type="text" placeholder="URL (e.g. https://drive.google.com/...)" className="w-full px-3 py-1.5 border rounded text-sm focus:outline-blue-500" value={tempResource.url} onChange={(e) => setTempResource({ ...tempResource, url: e.target.value })} />
                                    ) : (
                                        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={(e) => setUploadFile(e.target.files[0])} />
                                    )}
                                </div>

                                <button onClick={handleAddResource} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium h-10 flex items-center">
                                    Add
                                </button>
                            </div>

                            {/* Resource List */}
                            {lesson.resources.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {lesson.resources.map((res, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border shadow-sm">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className={`p-1.5 rounded-full ${res.type === 'file' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {res.type === 'file' ? <FileText size={14} /> : <LinkIcon size={14} />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-medium truncate">{res.title}</span>
                                                    {/* Hiển thị tên file nếu chưa có URL */}
                                                    <span className="text-xs text-gray-400 truncate max-w-[200px]">
                                                        {res.type === 'file' && res.file ? `File: ${res.file.name}` : <Link target="_blank" to={res.url}>{res.url}</Link>}
                                                    </span>

                                                </div>
                                            </div>
                                            <button onClick={() => removeResource(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-medium transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm">
                        {isEditing ? 'Save Changes' : 'Add Lesson'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessonModal;