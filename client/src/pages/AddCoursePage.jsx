import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import {
    Check, ChevronRight, ChevronLeft, Upload,
    Trash2, PlusCircle, X, Image as ImageIcon,
    PlayCircle, Link as LinkIcon, FileText, LayoutList,
    Edit2, Save
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux'; // Redux Hook
import { createNewCourse } from '../features/course/courseSlice';
import { useNavigate } from 'react-router-dom';
import { courseApi } from '../api/courseApi'; // Import api để upload video trực tiếp
import { categoryApi } from '../api/categoryApi';

// --- SUB-COMPONENT: REUSABLE DYNAMIC LIST ---
// Dùng cho: Requirements, Audience, Learn Outcomes, Includes
const DynamicListInput = ({ title, items, onAdd, onRemove, onChange, placeholder }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h6 className="font-semibold text-gray-700 mb-3">{title}</h6>
        {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
                <input
                    type="text"
                    value={item}
                    onChange={(e) => onChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={placeholder}
                />
                <button
                    onClick={() => onRemove(idx)}
                    className="text-red-500 hover:bg-red-100 p-2 rounded transition"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        ))}
        <button
            onClick={onAdd}
            className="text-blue-600 text-sm font-medium flex items-center mt-2 hover:text-blue-800"
        >
            <PlusCircle size={16} className="mr-1" /> Add New Item
        </button>
    </div>
);

// --- SUB-COMPONENT: VIDEO INPUT SELECTOR ---
const VideoInputSelector = ({ type, urlValue, onTypeChange, onUrlChange, onFileChange }) => (
    <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex gap-4 mb-4 border-b pb-2">
            <button
                type="button"
                onClick={() => onTypeChange('url')}
                className={`flex items-center gap-2 pb-2 px-2 transition-colors ${type === 'url' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
            >
                <LinkIcon size={18} /> URL / YouTube
            </button>
            <button
                type="button"
                onClick={() => onTypeChange('upload')}
                className={`flex items-center gap-2 pb-2 px-2 transition-colors ${type === 'upload' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
            >
                <Upload size={18} /> Upload Video
            </button>
        </div>

        {type === 'url' ? (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://youtube.com/..."
                    value={urlValue}
                    onChange={(e) => onUrlChange(e.target.value)}
                />
            </div>
        ) : (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Video File (.mp4, .mov)</label>
                <input
                    type="file"
                    accept="video/*"
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    onChange={onFileChange}
                />
            </div>
        )}
    </div>
);

// --- MAIN COMPONENT ---
const AddCoursePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading } = useSelector(state => state.course); // Lấy loading state từ redux

    // State cho danh mục
    const [categories, setCategories] = useState([]);
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    // State riêng để nhập tên category mới
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingNewCat, setIsAddingNewCat] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);

    // State khớp với Course Model
    const [courseData, setCourseData] = useState({
        title: '',
        categories: [],
        level: 'alllevels',
        language: 'Vietnamese',
        price: 0,
        priceDiscount: 0,
        isFree: false,
        shortDescription: '',
        description: '',
        thumbnail: null,
        thumbnailPreview: '',

        // Video Preview (previewUrl in model)
        previewVideoType: 'url',
        previewVideoUrl: '',
        previewVideoFile: null,

        // Arrays from Model
        learnOutcomes: [], // "What will students learn"
        requirements: [],  // "Requirements"
        audience: [],      // "Target Audience"
        includes: [],      // "Course Includes"

        // Curriculum
        sections: [],

        // Workflow
        messageToReviewer: '',
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryApi.getAllCategories();
                // Giả sử API trả về { success: true, data: [...] } hoặc mảng trực tiếp
                const list = res.data?.data || res.data || [];
                setCategories(list);
            } catch (error) {
                console.error("Failed to load categories", error);
            }
        };
        fetchCategories();
    }, []);

    // Chọn từ dropdown có sẵn
    const handleSelectCategory = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;

        if (selectedId === 'custom_new') {
            setIsAddingNewCat(true);
            return;
        }

        // Kiểm tra trùng lặp
        const isExist = courseData.categories.some(cat => cat.value === selectedId);
        if (!isExist) {
            // Tìm tên category để hiển thị trên UI
            const catObj = categories.find(c => c._id === selectedId);
            if (catObj) {
                setCourseData(prev => ({
                    ...prev,
                    categories: [...prev.categories, { value: selectedId, label: catObj.name, isNew: false }]
                }));
            }
        }
    };

    // Thêm category mới do user nhập tay
    const handleAddCustomCategory = () => {
        if (!newCategoryName.trim()) return;

        // Kiểm tra trùng
        const isExist = courseData.categories.some(cat => cat.label.toLowerCase() === newCategoryName.toLowerCase());
        if (!isExist) {
            setCourseData(prev => ({
                ...prev,
                categories: [...prev.categories, { value: newCategoryName, label: newCategoryName, isNew: true }]
            }));
        }
        setNewCategoryName('');
        setIsAddingNewCat(false);
    };

    // Xóa category đã chọn
    const removeCategory = (indexToRemove) => {
        setCourseData(prev => ({
            ...prev,
            categories: prev.categories.filter((_, index) => index !== indexToRemove)
        }));
    };

    // --- Handlers ---
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Logic riêng cho select category
        if (name === 'category' && value === 'custom_new') {
            setIsCustomCategory(true);
            setCourseData(prev => ({ ...prev, category: '' }));
            return;
        }

        setCourseData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleThumbnailUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCourseData(prev => ({
                ...prev,
                thumbnail: file,
                thumbnailPreview: URL.createObjectURL(file)
            }));
        }
    };

    // Generic Array Handler
    const handleArrayAction = (field, action, index, value) => {
        const newArray = [...courseData[field]];
        if (action === 'add') newArray.push('');
        if (action === 'remove') newArray.splice(index, 1);
        if (action === 'update') newArray[index] = value;
        setCourseData({ ...courseData, [field]: newArray });
    };

    // --- Curriculum & Lesson Logic ---
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(null);
    const [editingSectionIndex, setEditingSectionIndex] = useState(null); // Track section being edited
    const [editingLectureIndex, setEditingLectureIndex] = useState(null); // Track lecture being edited inside a section


    // Temp Lesson State (Matches Lecture Model)
    const [tempLesson, setTempLesson] = useState({
        title: '',
        videoType: 'url',
        videoUrl: '',
        videoFile: null,
        duration: 0,
        isPreviewFree: false,
        resources: [] // [{ title, url, type }]
    });

    // Resources Handler (Inside Lesson)
    const [tempResource, setTempResource] = useState({ title: '', url: '' });

    const addResourceToLesson = () => {
        if (!tempResource.title || !tempResource.url) return toast.error("Resource requires title and URL");
        setTempLesson(prev => ({
            ...prev,
            resources: [...prev.resources, { ...tempResource, type: 'link' }]
        }));
        setTempResource({ title: '', url: '' });
    };

    // Section Actions
    const addSection = () => {
        setCourseData(prev => ({
            ...prev,
            sections: [...prev.sections, { title: 'New Section', lectures: [], isEditing: true }] // Auto edit mode
        }));
    };

    const updateSectionTitle = (index, title) => {
        const newSections = [...courseData.sections];
        newSections[index].title = title;
        setCourseData({ ...courseData, sections: newSections });
    };

    const toggleSectionEdit = (index) => {
        const newSections = [...courseData.sections];
        // Nếu đang edit thì save (tắt edit), nếu không thì bật edit
        newSections[index].isEditing = !newSections[index].isEditing;
        setCourseData({ ...courseData, sections: newSections });
    };

    const deleteSection = (index) => {
        if (window.confirm("Are you sure you want to delete this section?")) {
            const newSections = [...courseData.sections];
            newSections.splice(index, 1);
            setCourseData({ ...courseData, sections: newSections });
        }
    };

    // Lecture Actions
    const openLessonModal = (sectionIndex, lectureIndex = null) => {
        setEditingSectionIndex(sectionIndex);
        setEditingLectureIndex(lectureIndex); // Nếu null là thêm mới, có số là sửa

        if (lectureIndex !== null) {
            // Load existing data to edit
            const existingLecture = courseData.sections[sectionIndex].lectures[lectureIndex];
            setTempLesson({ ...existingLecture, videoFile: null }); // Reset file input for safety
        } else {
            // Reset for new
            setTempLesson({
                title: '', videoType: 'url', videoUrl: '',
                videoFile: null, duration: 0, isPreviewFree: false, resources: []
            });
        }
        setIsLessonModalOpen(true);
    };

    const deleteLecture = (sectionIndex, lectureIndex) => {
        if (window.confirm("Delete this lecture?")) {
            const newSections = [...courseData.sections];
            newSections[sectionIndex].lectures.splice(lectureIndex, 1);
            setCourseData({ ...courseData, sections: newSections });
        }
    };

    const saveLesson = () => {
        if (!tempLesson.title) return toast.error("Lesson title is required");

        const newSections = [...courseData.sections];

        if (editingLectureIndex !== null) {
            // Update existing
            // Giữ lại videoUrl cũ nếu user không upload/nhập mới, nhưng ở đây tempLesson đã copy rồi
            newSections[editingSectionIndex].lectures[editingLectureIndex] = { ...tempLesson };
        } else {
            // Add new
            newSections[editingSectionIndex].lectures.push({ ...tempLesson });
        }

        setCourseData({ ...courseData, sections: newSections });
        setIsLessonModalOpen(false);
        toast.success(editingLectureIndex !== null ? "Lesson updated" : "Lesson added");
    };

    const nextStep = () => currentStep < 5 && setCurrentStep(curr => curr + 1);
    const prevStep = () => currentStep > 1 && setCurrentStep(curr => curr - 1);

    const handleSubmit = async () => {
        if (!courseData.title) return toast.error("Vui lòng nhập tên khóa học");
        // if (!courseData.thumbnail) return toast.error("Vui lòng chọn ảnh bìa (Thumbnail)");
        if (courseData.categories.length === 0) return toast.error("Vui lòng chọn ít nhất 1 danh mục");

        const loadingId = toast.loading("Đang xử lý dữ liệu...");

        try {
            // 1. Clone data
            const finalCourseData = { ...courseData };
            const processedSections = [...finalCourseData.sections];

            // ---------------------------------------------------------
            // BƯỚC A: XỬ LÝ UPLOAD COURSE PREVIEW VIDEO (Nếu có file)
            // ---------------------------------------------------------
            if (finalCourseData.previewVideoType === 'upload' && finalCourseData.previewVideoFile) {
                toast.loading("Đang upload video giới thiệu...", { id: loadingId });

                const previewFormData = new FormData();
                previewFormData.append('video', finalCourseData.previewVideoFile);
                previewFormData.append('title', `Preview: ${finalCourseData.title}`);

                const previewRes = await courseApi.uploadVideo(previewFormData);

                if (previewRes.data.success) {
                    // Gán URL trả về từ Youtube
                    finalCourseData.previewUrl = previewRes.data.data.videoUrl;
                } else {
                    throw new Error("Lỗi upload video giới thiệu");
                }
            } else {
                // Nếu là URL, dùng trực tiếp
                finalCourseData.previewUrl = finalCourseData.previewVideoUrl;
            }

            // ---------------------------------------------------------
            // BƯỚC B: XỬ LÝ UPLOAD VIDEO CHO TỪNG BÀI HỌC
            // ---------------------------------------------------------
            for (let i = 0; i < processedSections.length; i++) {
                const section = processedSections[i];
                const processedLectures = [...section.lectures];

                for (let j = 0; j < processedLectures.length; j++) {
                    const lecture = processedLectures[j];

                    if (lecture.videoType === 'upload' && lecture.videoFile) {
                        toast.loading(`Đang upload bài học: ${lecture.title}...`, { id: loadingId });

                        const videoFormData = new FormData();
                        videoFormData.append('video', lecture.videoFile);
                        videoFormData.append('title', lecture.title);

                        const uploadRes = await courseApi.uploadVideo(videoFormData);

                        if (uploadRes.data.success) {
                            processedLectures[j] = {
                                ...lecture,
                                videoUrl: uploadRes.data.data.videoUrl,
                                videoFile: null // Xóa file object để nhẹ payload
                            };
                        }
                    }
                }
                processedSections[i].lectures = processedLectures;
            }

            // ---------------------------------------------------------
            // BƯỚC C: ĐÓNG GÓI FORM DATA GỬI VỀ BACKEND
            // ---------------------------------------------------------
            const formData = new FormData();

            // Các trường Text cơ bản
            formData.append('title', finalCourseData.title);
            // formData.append('category', finalCourseData.category);
            finalCourseData.categories.forEach(cat => {
                formData.append('categories', cat.value);
            });
            formData.append('level', finalCourseData.level);
            formData.append('language', finalCourseData.language);
            formData.append('price', finalCourseData.isFree ? 0 : finalCourseData.price);
            formData.append('priceDiscount', finalCourseData.isFree ? 0 : finalCourseData.priceDiscount);
            formData.append('shortDescription', finalCourseData.shortDescription);
            formData.append('description', finalCourseData.description);
            formData.append('previewUrl', finalCourseData.previewUrl); // URL video giới thiệu

            // Các mảng String (Append từng item để Multer hiểu là mảng)
            finalCourseData.learnOutcomes.forEach(item => formData.append('learnOutcomes', item));
            finalCourseData.requirements.forEach(item => formData.append('requirements', item));
            finalCourseData.audience.forEach(item => formData.append('audience', item));
            finalCourseData.includes.forEach(item => formData.append('includes', item));

            // Thumbnail Image
            if (finalCourseData.thumbnail) {
                formData.append('thumbnail', finalCourseData.thumbnail);
            }

            // Sections (JSON string)
            // Backend sẽ JSON.parse field này
            formData.append('sections', JSON.stringify(processedSections));

            // ---------------------------------------------------------
            // BƯỚC D: GỌI API CREATE COURSE
            // ---------------------------------------------------------
            toast.loading("Đang tạo khóa học...", { id: loadingId });
            const resultAction = await dispatch(createNewCourse(formData));

            if (createNewCourse.fulfilled.match(resultAction)) {
                toast.success("Tạo khóa học thành công!", { id: loadingId });
                navigate('/instructor/courses');
            } else {
                toast.error(resultAction.payload || "Tạo khóa học thất bại", { id: loadingId });
            }

        } catch (error) {
            console.error(error);
            toast.error("Có lỗi xảy ra, vui lòng thử lại.", { id: loadingId });
        }
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4 font-sans text-gray-800">
            <Toaster position="top-right" />

            <div className="max-w-6xl mx-auto">
                {/* Progress Bar */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <ul className="flex justify-between items-center relative">
                        {["Course Info", "Media", "Curriculum", "Details", "Pricing"].map((label, idx) => {
                            const step = idx + 1;
                            return (
                                <li key={idx} className="flex flex-col items-center z-10 w-full">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${step === currentStep ? 'bg-blue-600 text-white shadow-lg scale-110' :
                                        step < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                                        }`}>
                                        {step < currentStep ? <Check size={20} /> : step}
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
                                </li>
                            )
                        })}
                        <div className="absolute top-5 left-0 h-1 bg-gray-200 w-full -z-0"></div>
                        <div className="absolute top-5 left-0 h-1 bg-green-500 transition-all duration-500 -z-0" style={{ width: `${((currentStep - 1) / 4) * 100}%` }}></div>
                    </ul>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-8 min-h-[600px]">

                    {/* STEP 1: BASIC INFO */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Course Information</h2>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Course Title <span className="text-red-500">*</span></label>
                                    <input type="text" name="title" value={courseData.title} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Complete Python Bootcamp" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* --- CATEGORY MULTI-SELECT UI --- */}
                                    <div className="md:col-span-3"> {/* Chiếm full dòng nếu nhiều category */}
                                        <label className="block text-sm font-bold mb-2">Categories <span className="text-red-500">*</span></label>

                                        {/* Khu vực hiển thị Tags đã chọn */}
                                        <div className="flex flex-wrap gap-2 mb-3 p-3 border rounded-lg bg-gray-50 min-h-[50px]">
                                            {courseData.categories.length === 0 && <span className="text-gray-400 text-sm py-1">No categories selected</span>}

                                            {courseData.categories.map((cat, idx) => (
                                                <span key={idx} className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 border ${cat.isNew ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                                                    {cat.label}
                                                    <X size={14} className="cursor-pointer hover:text-red-600" onClick={() => removeCategory(idx)} />
                                                </span>
                                            ))}
                                        </div>

                                        {/* Khu vực chọn/nhập Category */}
                                        {!isAddingNewCat ? (
                                            <select
                                                onChange={handleSelectCategory}
                                                className="w-full px-4 py-3 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
                                                value="" // Luôn reset về default để chọn tiếp cái khác
                                            >
                                                <option value="" disabled>Select a category to add...</option>
                                                {categories.map(cat => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                                <option value="custom_new" className="font-bold text-blue-600 bg-blue-50">+ Create New Category</option>
                                            </select>
                                        ) : (
                                            <div className="flex gap-2 animate-fadeIn">
                                                <input
                                                    type="text"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    placeholder="Type new category name..."
                                                    className="flex-1 px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 border-green-300"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                                                />
                                                <button
                                                    onClick={handleAddCustomCategory}
                                                    className="px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    onClick={() => { setIsAddingNewCat(false); setNewCategoryName(''); }}
                                                    className="px-4 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">You can select multiple categories or create new ones.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Level</label>
                                        <select name="level" value={courseData.level} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg outline-none bg-white">
                                            <option value="alllevels">All Levels</option>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Language</label>
                                        <select name="language" value={courseData.language} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg outline-none bg-white">
                                            <option value="vn">Vietnamese</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-2">Short Description</label>
                                    <textarea name="shortDescription" value={courseData.shortDescription} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg h-24 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief summary of the course..."></textarea>
                                </div>

                                {/* Dynamic Lists Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DynamicListInput
                                        title="What will students learn? (Learning Outcomes)"
                                        items={courseData.learnOutcomes}
                                        placeholder="e.g. Build fullstack apps"
                                        onAdd={() => handleArrayAction('learnOutcomes', 'add')}
                                        onRemove={(idx) => handleArrayAction('learnOutcomes', 'remove', idx)}
                                        onChange={(idx, val) => handleArrayAction('learnOutcomes', 'update', idx, val)}
                                    />
                                    <DynamicListInput
                                        title="Target Audience"
                                        items={courseData.audience}
                                        placeholder="e.g. Beginners in coding"
                                        onAdd={() => handleArrayAction('audience', 'add')}
                                        onRemove={(idx) => handleArrayAction('audience', 'remove', idx)}
                                        onChange={(idx, val) => handleArrayAction('audience', 'update', idx, val)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: MEDIA */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Course Media</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Thumbnail */}
                                <div>
                                    <label className="block text-sm font-bold mb-2">Course Thumbnail</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden group hover:border-blue-400 transition">
                                        {courseData.thumbnailPreview ? (
                                            <>
                                                <img src={courseData.thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                                                <button onClick={() => setCourseData(p => ({ ...p, thumbnail: null, thumbnailPreview: '' }))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"><X size={16} /></button>
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon size={48} className="text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500">Click to upload image</p>
                                                <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Preview Video */}
                                <div>
                                    <label className="block text-sm font-bold mb-2">Course Intro Video</label>
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
                    )}

                    {/* STEP 3: CURRICULUM */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex justify-between items-center border-b pb-4">
                                <h2 className="text-2xl font-bold">Curriculum</h2>
                                <button onClick={addSection} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow">
                                    <PlusCircle size={18} /> New Section
                                </button>
                            </div>

                            {courseData.sections.length === 0 && <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">No sections yet. Start by adding one!</div>}

                            {courseData.sections.map((section, sIdx) => (
                                <div key={sIdx} className="border border-gray-200 rounded-lg overflow-hidden mb-5 shadow-sm bg-white">
                                    <div className="bg-gray-100 p-4 flex items-center gap-3 border-b group">
                                        <LayoutList size={20} className="text-gray-500" />
                                        <span className="font-bold text-gray-700 whitespace-nowrap">Section {sIdx + 1}:</span>
                                        {/* EDIT SECTION TITLE UI */}
                                        {section.isEditing ? (
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={section.title}
                                                    onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                                                    className="flex-1 bg-white border border-blue-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
                                                    placeholder="Section Title..."
                                                    autoFocus
                                                />
                                                <button onClick={() => toggleSectionEdit(sIdx)} className="bg-green-500 text-white p-1 rounded hover:bg-green-600" title="Save Title"><Check size={16} /></button>
                                            </div>
                                        ) : (
                                            <span className="flex-1 font-medium text-gray-800">{section.title || "(Untitled Section)"}</span>
                                        )}

                                        {/* Section Actions */}
                                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            {!section.isEditing && (
                                                <button onClick={() => toggleSectionEdit(sIdx)} className="text-gray-400 hover:text-red-600 p-1" title="Edit Name"><Edit2 size={16} /></button>
                                            )}
                                            <button onClick={() => deleteSection(sIdx)} className="text-gray-400 hover:text-red-600 p-1" title="Delete Section"><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        {section.lectures.map((lec, lIdx) => (
                                            <div key={lIdx} className="flex items-center justify-between p-3 mb-2 bg-gray-50 border rounded-lg hover:bg-blue-50 transition">
                                                <div className="flex items-center gap-3">
                                                    <PlayCircle className="text-blue-500" size={20} />
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-800">{lec.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {lec.duration} min • {lec.resources.length} resources • {lec.isPreviewFree ? 'Free Preview' : 'Locked'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Lecture Actions */}
                                                <div className="flex gap-2">
                                                    <button onClick={() => openLessonModal(sIdx, lIdx)} className="text-gray-400 hover:text-blue-600 p-1" title="Edit Lecture"><Edit2 size={16} /></button>
                                                    <button onClick={() => deleteLecture(sIdx, lIdx)} className="text-gray-400 hover:text-red-600 p-1" title="Delete Lecture"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => openLessonModal(sIdx, null)} className="mt-2 text-sm text-blue-600 font-bold flex items-center gap-1 hover:underline">
                                            <PlusCircle size={16} /> Add Lesson Content
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* STEP 4: ADDITIONAL DETAILS */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Additional Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DynamicListInput
                                    title="Requirements"
                                    items={courseData.requirements}
                                    placeholder="e.g. Basic HTML knowledge"
                                    onAdd={() => handleArrayAction('requirements', 'add')}
                                    onRemove={(idx) => handleArrayAction('requirements', 'remove', idx)}
                                    onChange={(idx, val) => handleArrayAction('requirements', 'update', idx, val)}
                                />
                                <DynamicListInput
                                    title="Course Includes"
                                    items={courseData.includes}
                                    placeholder="e.g. 10 hours video, Certificate"
                                    onAdd={() => handleArrayAction('includes', 'add')}
                                    onRemove={(idx) => handleArrayAction('includes', 'remove', idx)}
                                    onChange={(idx, val) => handleArrayAction('includes', 'update', idx, val)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Detailed Description</label>
                                <textarea name="description" value={courseData.description} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg h-40 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full course details..."></textarea>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: PRICING */}
                    {currentStep === 5 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Pricing</h2>

                            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg border">
                                <input type="checkbox" id="isFree" name="isFree" checked={courseData.isFree} onChange={handleInputChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                <label htmlFor="isFree" className="font-medium text-gray-700 cursor-pointer select-none">This is a free course</label>
                            </div>

                            {!courseData.isFree && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Regular Price (VND)</label>
                                        <div className="relative">
                                            <input type="number" name="price" value={courseData.price} onChange={handleInputChange} className="w-full pl-8 pr-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Discounted Price (VND)</label>
                                        <div className="relative">
                                            <input type="number" name="priceDiscount" value={courseData.priceDiscount} onChange={handleInputChange} className="w-full pl-8 pr-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Must be lower than regular price.</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold mb-2">Message to Reviewer</label>
                                <textarea name="messageToReviewer" value={courseData.messageToReviewer} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg h-32 outline-none" placeholder="Any notes for the admin..."></textarea>
                            </div>
                        </div>
                    )}

                    {/* NAVIGATION FOOTER */}
                    <div className="flex justify-between mt-10 pt-6 border-t">
                        {currentStep > 1 ? (
                            <button onClick={prevStep} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2">
                                <ChevronLeft size={18} /> Previous
                            </button>
                        ) : <div></div>}

                        {currentStep < 5 ? (
                            <button onClick={nextStep} className="px-6 py-2.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 flex items-center gap-2 shadow-lg">
                                Next Step <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="px-8 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg transform hover:scale-105 transition disabled:opacity-70"
                            >
                                {isLoading ? 'Processing...' : 'Submit Course'} <Check size={18} />
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {/* --- MODAL: ADD/EDIT LESSON --- */}
            {isLessonModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingLectureIndex !== null ? 'Edit Lesson' : 'Add New Lesson'}
                            </h3>
                            <button onClick={() => setIsLessonModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-5">
                            <div>
                                <label className="block text-sm font-bold mb-1">Lesson Title <span className="text-red-500">*</span></label>
                                <input type="text" value={tempLesson.title} onChange={(e) => setTempLesson({ ...tempLesson, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Lesson Video</label>
                                <VideoInputSelector
                                    type={tempLesson.videoType}
                                    urlValue={tempLesson.videoUrl}
                                    onTypeChange={(t) => setTempLesson({ ...tempLesson, videoType: t })}
                                    onUrlChange={(v) => setTempLesson({ ...tempLesson, videoUrl: v })}
                                    onFileChange={(e) => setTempLesson({ ...tempLesson, videoFile: e.target.files[0] })}
                                />
                            </div>
                            <div className="flex gap-6">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold mb-1">Duration (seconds)</label>
                                    <input type="number" value={tempLesson.duration} onChange={(e) => setTempLesson({ ...tempLesson, duration: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div className="flex-1 flex items-center pt-6">
                                    <input type="checkbox" id="isPreviewFree" checked={tempLesson.isPreviewFree} onChange={(e) => setTempLesson({ ...tempLesson, isPreviewFree: e.target.checked })} className="w-5 h-5 text-blue-600 rounded mr-2" />
                                    <label htmlFor="isPreviewFree" className="text-sm font-medium">Free Preview</label>
                                </div>
                            </div>
                            {/* Resources Logic Giữ Nguyên */}
                            <div className="border-t pt-4">
                                <label className="block text-sm font-bold mb-2">Resources (Beta/Comming Soon)</label>
                                <div className="bg-gray-50 p-3 rounded-lg border mb-3">
                                    <div className="flex gap-2 mb-2">
                                        <input type="text" placeholder="Title" className="flex-1 px-3 py-1.5 border rounded text-sm" value={tempResource.title} onChange={(e) => setTempResource({ ...tempResource, title: e.target.value })} />
                                        <input type="text" placeholder="URL" className="flex-1 px-3 py-1.5 border rounded text-sm" value={tempResource.url} onChange={(e) => setTempResource({ ...tempResource, url: e.target.value })} />
                                        <button onClick={addResourceToLesson} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 text-sm">Add</button>
                                    </div>
                                    <div className="space-y-1">
                                        {tempLesson.resources.map((res, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                                                <span className="font-medium">{res.title}</span>
                                                <button onClick={() => {
                                                    const newRes = [...tempLesson.resources];
                                                    newRes.splice(idx, 1);
                                                    setTempLesson({ ...tempLesson, resources: newRes });
                                                }} className="text-red-500"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button onClick={() => setIsLessonModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-medium">Cancel</button>
                            <button onClick={saveLesson} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddCoursePage;