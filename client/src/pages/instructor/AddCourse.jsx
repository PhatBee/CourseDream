// src/pages/instructor/AddCourse.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Check, ChevronRight, ChevronLeft, Save, XCircle, BookOpen } from 'lucide-react';

// Redux & API
import { createNewCourse } from '../../features/course/courseSlice';
import { categoryApi } from '../../api/categoryApi';

// Hooks & Components
import { useAddCourseForm } from '../../features/course/useAddCourseForm';
import Step1_CourseInfo from '../../components/instructor/Step1_CourseInfo';
import Step2_Media from '../../components/instructor/Step2_Media';
import Step3_Curriculum from '../../components/instructor/Step3_Curriculum';
import Step4_Details from '../../components/instructor/Step4_Details';
import Step5_Pricing from '../../components/instructor/Step5_Pricing';
import LessonModal from '../../components/instructor/LessonModal';
import CancelModal from '../../components/common/CancelModal';

const STEPS = [
    { label: 'Thông tin', icon: '📝' },
    { label: 'Media', icon: '🎨' },
    { label: 'Nội dung', icon: '📚' },
    { label: 'Chi tiết', icon: '📋' },
    { label: 'Giá', icon: '💰' },
];

const AddCoursePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading } = useSelector(state => state.course);

    const [currentStep, setCurrentStep] = useState(1);
    const [categoriesList, setCategoriesList] = useState([]);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [editingSectionIndex, setEditingSectionIndex] = useState(null);
    const [editingLectureIndex, setEditingLectureIndex] = useState(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const form = useAddCourseForm();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryApi.getAllCategoriesSimple();
                setCategoriesList(res.data?.data || []);
            } catch (error) {
                console.error("Failed to load categories", error);
            }
        };
        fetchCategories();
    }, []);

    /**
     * Submit Handler (AWS version)
     * Videos, thumbnails, previews đã được upload lên S3 trong từng Step.
     * Ở đây chỉ cần pack FormData với các CDN URLs đã có và gọi API tạo Course Revision.
     */
    const handleProcessCourse = async (actionType) => {
        const { courseData } = form;
        const isDraft = actionType === 'draft';

        // Validation
        if (!isDraft) {
            if (!courseData.title) return toast.error('Vui lòng nhập tên khóa học');
            if (courseData.categories.length === 0) return toast.error('Vui lòng chọn danh mục');
            if (!courseData.thumbnail && !courseData.thumbnailUrl) return toast.error('Vui lòng upload thumbnail (ảnh bìa)');
        } else {
            if (!courseData.title) return toast.error('Vui lòng nhập tên khóa học để lưu nháp');
        }

        const toastId = toast.loading(isDraft ? 'Đang lưu nháp...' : 'Đang tạo khóa học...');

        try {
            // Pack FormData - tất cả media đều là CDN URLs từ S3
            const formData = new FormData();
            formData.append('title', courseData.title);

            // ✨ Gửi slug frontend đã generate (consistent với S3 key)
            // Backend sẽ dùng slug này thay vì tạo random mới
            if (courseData.slug) {
                formData.append('slug', courseData.slug);
            }

            courseData.categories.forEach(cat => formData.append('categories', cat.value));
            formData.append('level', courseData.level);
            formData.append('language', courseData.language);
            formData.append('price', courseData.isFree ? 0 : courseData.price);
            formData.append('priceDiscount', courseData.isFree ? 0 : courseData.priceDiscount);
            formData.append('shortDescription', courseData.shortDescription || '');
            formData.append('description', courseData.description || '');

            // Thumbnail - ưu tiên CDN URL từ S3 (đã upload ở Step 2)
            const thumbnailCDN = courseData.thumbnailUrl || courseData.thumbnail || '';
            formData.append('thumbnailUrl', thumbnailCDN);

            // Preview video CDN URL (đã upload ở Step 2)
            const previewCDN = courseData.previewUrl || courseData.previewVideoUrl || '';
            formData.append('previewUrl', previewCDN);

            // Status
            const statusToSend = isDraft ? (courseData.status || 'draft') : 'pending';
            formData.append('status', statusToSend);

            // Array fields
            ['learnOutcomes', 'requirements', 'audience', 'includes'].forEach(field => {
                (courseData[field] || []).forEach(item => formData.append(field, item));
            });

            // Sections - tất cả videoUrl trong lectures phải là CDN URLs (đã upload qua LessonModal)
            const sections = courseData.sections.map(sec => ({
                title: sec.title,
                order: sec.order || 0,
                lectures: sec.lectures.map((lec, lIdx) => ({
                    title: lec.title,
                    videoUrl: lec.videoUrl || '', // CDN URL từ S3
                    duration: lec.duration || 0,
                    order: lec.order || lIdx,
                    isPreviewFree: lec.isPreviewFree || false,
                    resources: (lec.resources || []).map(res => ({
                        title: res.title,
                        url: res.url || '',
                        type: res.type || 'link'
                    }))
                }))
            }));
            formData.append('sections', JSON.stringify(sections));

            // Dispatch
            const resultAction = await dispatch(createNewCourse(formData));

            if (createNewCourse.fulfilled.match(resultAction)) {
                toast.success(
                    isDraft ? '✅ Đã lưu nháp!' : '🎉 Đã gửi khóa học lên chờ Admin duyệt!',
                    { id: toastId, duration: 3000 }
                );
                navigate('/profile/instructor/courses');
            } else {
                toast.error(resultAction.payload || 'Thất bại', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra.', { id: toastId });
        }
    };

    const onSaveDraft = () => handleProcessCourse('draft');
    const onSubmit = () => handleProcessCourse('submit');
    const onCancel = () => setIsCancelModalOpen(true);

    const handleModalSaveDraft = () => {
        setIsCancelModalOpen(false);
        handleProcessCourse('draft');
    };

    const handleModalExit = () => {
        setIsCancelModalOpen(false);
        navigate('/profile/instructor/courses');
    };

    const handleOpenLessonModal = (sIdx, lIdx) => {
        // ✨ Ensure slug tồn tại trước khi upload video/resource lên S3
        if (!form.courseData.slug) {
            if (!form.courseData.title) {
                toast.error('Vui lòng nhập tên khóa học trước khi thêm bài học');
                return;
            }
            form.ensureSlug();
        }
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

    const nextStep = () => {
        if (currentStep < 5) {
            // Khi chuyển sang Step 2 (Media/Video), đảm bảo có slug cho S3 key
            if (currentStep === 1) {
                if (!form.courseData.title) {
                    toast.error('Vui lòng nhập tên khóa học trước');
                    return;
                }
                form.ensureSlug(); // ✨ Generate slug nếu chưa có
            }
            setCurrentStep(c => c + 1);
        }
    };
    const prevStep = () => currentStep > 1 && setCurrentStep(c => c - 1);

    // Get course slug for S3 key generation
    // ensureSlug() validates slug tồn tại (hoặc tạo mới nếu chưa có) - trả về giá trị ngay lập tức
    const courseSlug = form.courseData?.slug || null;

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1_CourseInfo
                        courseData={form.courseData}
                        handleInputChange={form.handleInputChange}
                        handleArrayAction={form.handleArrayAction}
                        categoriesList={categoriesList}
                        updateCategories={form.updateCategories}
                    />
                );
            case 2:
                return (
                    <Step2_Media
                        courseData={form.courseData}
                        setCourseData={form.setCourseData}
                        courseSlug={courseSlug}
                    />
                );
            case 3:
                return (
                    <Step3_Curriculum
                        sections={form.courseData.sections}
                        addSection={form.addSection}
                        updateSection={form.updateSection}
                        removeSection={form.removeSection}
                        openLessonModal={handleOpenLessonModal}
                        deleteLecture={form.removeLecture}
                    />
                );
            case 4:
                return (
                    <Step4_Details
                        courseData={form.courseData}
                        handleInputChange={form.handleInputChange}
                        handleArrayAction={form.handleArrayAction}
                    />
                );
            case 5:
                return (
                    <Step5_Pricing
                        courseData={form.courseData}
                        handleInputChange={form.handleInputChange}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
            <div className="max-w-5xl mx-auto">

                {/* Page Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                            <BookOpen size={20} className="text-rose-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tạo khóa học mới</h1>
                            <p className="text-sm text-gray-500">Video lưu trên AWS S3 & CloudFront CDN</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <XCircle size={16} /> Hủy
                        </button>
                        <button
                            onClick={onSaveDraft}
                            disabled={isLoading}
                            className="px-4 py-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                        >
                            <Save size={16} /> Lưu nháp
                        </button>
                    </div>
                </div>

                {/* Stepper */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-center relative">
                        {/* Progress line background */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 z-0" />
                        {/* Active progress line */}
                        <div
                            className="absolute top-5 left-0 h-0.5 bg-rose-500 z-0 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                        />

                        {STEPS.map((step, idx) => {
                            const stepNum = idx + 1;
                            const isActive = stepNum === currentStep;
                            const isDone = stepNum < currentStep;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center z-10">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all duration-300 border-2 ${isActive
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200 scale-110'
                                            : isDone
                                                ? 'bg-rose-500 text-white border-rose-500'
                                                : 'bg-white text-gray-400 border-gray-200'
                                            }`}
                                    >
                                        {isDone ? <Check size={18} /> : step.icon}
                                    </div>
                                    <span className={`text-xs font-semibold ${isActive ? 'text-rose-600' : isDone ? 'text-rose-400' : 'text-gray-400'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[560px] relative">
                    {renderStepContent()}

                    {/* Navigation */}
                    <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                        {currentStep > 1 ? (
                            <button onClick={prevStep} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors">
                                <ChevronLeft size={18} /> Quay lại
                            </button>
                        ) : <div />}

                        {currentStep < 5 ? (
                            <button onClick={nextStep} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 flex items-center gap-2 shadow-md transition-colors">
                                Tiếp theo <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={onSubmit}
                                disabled={isLoading}
                                className="px-8 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 flex items-center gap-2 shadow-lg shadow-rose-200 transition-all disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} /> Gửi lên Admin duyệt
                                    </>
                                )}
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
                    initialData={
                        editingLectureIndex !== null
                            ? form.courseData.sections[editingSectionIndex]?.lectures[editingLectureIndex]
                            : null
                    }
                    isEditing={editingLectureIndex !== null}
                    courseSlug={courseSlug}
                />
            )}

            {/* Cancel Modal */}
            <CancelModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onSaveDraft={handleModalSaveDraft}
                onExit={handleModalExit}
            />
        </div>
    );
};

export default AddCoursePage;