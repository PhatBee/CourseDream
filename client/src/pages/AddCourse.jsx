import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';

// Redux & API
import { createNewCourse } from '../features/course/courseSlice';
import { courseApi } from '../api/courseApi';
import { categoryApi } from '../api/categoryApi';

// Hooks & Components
import { useAddCourseForm } from '../features/course/useAddCourseForm';
import Step1_CourseInfo from '../components/instructor/Step1_CourseInfo';
import Step2_Media from '../components/instructor/Step2_Media'; // Tách tương tự Step1
import Step3_Curriculum from '../components/instructor/Step3_Curriculum';
import Step4_Details from '../components/instructor/Step4_Details'; // Tách tương tự
import Step5_Pricing from '../components/instructor/Step5_Pricing'; // Tách tương tự
import LessonModal from '../components/instructor/LessonModal';

const AddCoursePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading } = useSelector(state => state.course);

    const [currentStep, setCurrentStep] = useState(1);
    const [categoriesList, setCategoriesList] = useState([]);

    // Modal State
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [editingSectionIndex, setEditingSectionIndex] = useState(null);
    const [editingLectureIndex, setEditingLectureIndex] = useState(null);

    // Use Custom Hook
    const form = useAddCourseForm();

    // Load Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryApi.getAllCategories();
                setCategoriesList(res.data?.data || res.data || []);
            } catch (error) {
                console.error("Failed to load categories", error);
            }
        };
        fetchCategories();
    }, []);

    // Helper: Upload Logic (Tách riêng để clean code)
    const uploadVideoHelper = async (file, title) => {
        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);
        const res = await courseApi.uploadVideo(formData);
        if (res.data.success) return res.data.data.videoUrl;
        throw new Error("Upload failed");
    };

    // Submit Handler
    const handleSubmit = async () => {
        const { courseData } = form;
        if (!courseData.title) return toast.error("Vui lòng nhập tên khóa học");
        if (courseData.categories.length === 0) return toast.error("Vui lòng chọn danh mục");

        const loadingId = toast.loading("Đang xử lý dữ liệu...");

        try {
            const finalCourseData = { ...courseData };
            const processedSections = [...finalCourseData.sections];

            // 1. Upload Preview Video
            if (finalCourseData.previewVideoType === 'upload' && finalCourseData.previewVideoFile) {
                toast.loading("Uploading preview video...", { id: loadingId });
                finalCourseData.previewUrl = await uploadVideoHelper(finalCourseData.previewVideoFile, `Preview: ${finalCourseData.title}`);
            } else {
                finalCourseData.previewUrl = finalCourseData.previewVideoUrl;
            }

            // 2. Upload Lecture Videos
            for (let i = 0; i < processedSections.length; i++) {
                const section = processedSections[i];
                const processedLectures = [...section.lectures];
                for (let j = 0; j < processedLectures.length; j++) {
                    const lecture = processedLectures[j];
                    if (lecture.videoType === 'upload' && lecture.videoFile) {
                        toast.loading(`Uploading: ${lecture.title}...`, { id: loadingId });
                        const videoUrl = await uploadVideoHelper(lecture.videoFile, lecture.title);

                        processedLectures[j] = {
                            ...lecture,
                            videoUrl: videoUrl,
                            videoFile: null
                        };
                    }
                }
                processedSections[i].lectures = processedLectures;
            }

            // 3. Pack FormData
            const formData = new FormData();
            formData.append('title', finalCourseData.title);
            finalCourseData.categories.forEach(cat => formData.append('categories', cat.value));
            formData.append('level', finalCourseData.level);
            formData.append('language', finalCourseData.language);
            formData.append('price', finalCourseData.isFree ? 0 : finalCourseData.price);
            formData.append('priceDiscount', finalCourseData.isFree ? 0 : finalCourseData.priceDiscount);
            formData.append('shortDescription', finalCourseData.shortDescription);
            formData.append('description', finalCourseData.description);
            formData.append('previewUrl', finalCourseData.previewUrl);

            // Arrays
            ['learnOutcomes', 'requirements', 'audience', 'includes'].forEach(field => {
                finalCourseData[field].forEach(item => formData.append(field, item));
            });

            if (finalCourseData.thumbnail) {
                formData.append('thumbnail', finalCourseData.thumbnail);
            }

            formData.append('sections', JSON.stringify(processedSections));

            // 4. Dispatch Redux Action
            toast.loading("Creating course...", { id: loadingId });
            const resultAction = await dispatch(createNewCourse(formData));

            if (createNewCourse.fulfilled.match(resultAction)) {
                toast.success("Thành công!", { id: loadingId });
                navigate('/instructor/courses');
            } else {
                toast.error(resultAction.payload || "Thất bại", { id: loadingId });
            }

        } catch (error) {
            console.error(error);
            toast.error("Có lỗi xảy ra.", { id: loadingId });
        }
    };

    // Modal Handlers
    const handleOpenLessonModal = (sIdx, lIdx) => {
        setEditingSectionIndex(sIdx);
        setEditingLectureIndex(lIdx);
        setIsLessonModalOpen(true);
    };

    const handleSaveLesson = (lessonData) => {
        if (editingLectureIndex !== null) {
            form.updateLecture(editingSectionIndex, editingLectureIndex, lessonData);
        } else {
            form.addLecture(editingSectionIndex, lessonData);
        }
        setIsLessonModalOpen(false);
    };

    // Navigation
    const nextStep = () => currentStep < 5 && setCurrentStep(c => c + 1);
    const prevStep = () => currentStep > 1 && setCurrentStep(c => c - 1);

    // Render Steps
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return <Step1_CourseInfo
                courseData={form.courseData}
                handleInputChange={form.handleInputChange}
                handleArrayAction={form.handleArrayAction}
                categoriesList={categoriesList}
                updateCategories={form.updateCategories}
            />;
            case 2: return <Step2_Media
                courseData={form.courseData}
                setCourseData={form.setCourseData}
                handleThumbnailUpload={form.handleThumbnailUpload}
            />;
            case 3: return <Step3_Curriculum
                sections={form.courseData.sections}
                addSection={form.addSection}
                updateSection={form.updateSection}
                removeSection={form.removeSection}
                openLessonModal={handleOpenLessonModal}
                deleteLecture={form.removeLecture}
            />;
            case 4: return <Step4_Details
                courseData={form.courseData}
                handleInputChange={form.handleInputChange}
                handleArrayAction={form.handleArrayAction}
            />;
            case 5: return <Step5_Pricing
                courseData={form.courseData}
                handleInputChange={form.handleInputChange}
            />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4 font-sans text-gray-800">
            <Toaster position="top-right" />
            <div className="max-w-6xl mx-auto">

                {/* Progress Bar - Bạn có thể tách ra component riêng */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <ul className="flex justify-between items-center relative">
                        {["Info", "Media", "Curriculum", "Details", "Pricing"].map((label, idx) => {
                            const step = idx + 1;
                            return (
                                <li key={idx} className="flex flex-col items-center z-10 w-full">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${step === currentStep ? 'bg-blue-600 text-white shadow-lg scale-110' : step < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                        {step < currentStep ? <Check size={20} /> : step}
                                    </div>
                                    <span className="text-xs font-semibold uppercase text-gray-500">{label}</span>
                                </li>
                            )
                        })}
                        <div className="absolute top-5 left-0 h-1 bg-gray-200 w-full -z-0"></div>
                        <div className="absolute top-5 left-0 h-1 bg-green-500 transition-all duration-500 -z-0" style={{ width: `${((currentStep - 1) / 4) * 100}%` }}></div>
                    </ul>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-8 min-h-[600px]">
                    {renderStepContent()}

                    <div className="flex justify-between mt-10 pt-6 border-t">
                        {currentStep > 1 ? (
                            <button onClick={prevStep} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2"><ChevronLeft size={18} /> Previous</button>
                        ) : <div></div>}

                        {currentStep < 5 ? (
                            <button onClick={nextStep} className="px-6 py-2.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 flex items-center gap-2 shadow-lg">Next Step <ChevronRight size={18} /></button>
                        ) : (
                            <button onClick={handleSubmit} disabled={isLoading} className="px-8 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg disabled:opacity-70">
                                {isLoading ? 'Processing...' : 'Submit Course'} <Check size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Lesson Modal */}
            {isLessonModalOpen && (
                <LessonModal
                    isOpen={isLessonModalOpen}
                    onClose={() => setIsLessonModalOpen(false)}
                    onSave={handleSaveLesson}
                    initialData={editingLectureIndex !== null ? form.courseData.sections[editingSectionIndex].lectures[editingLectureIndex] : null}
                    isEditing={editingLectureIndex !== null}
                />
            )}
        </div>
    );
};

export default AddCoursePage;