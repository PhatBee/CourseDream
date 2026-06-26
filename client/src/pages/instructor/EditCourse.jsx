// src/pages/instructor/EditCourse.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    Check, ChevronRight, ChevronLeft, Save, XCircle,
    BookOpen, AlertTriangle, Send, Loader2, AlertCircle
} from 'lucide-react';

// Redux & API
import { createNewCourse } from '../../features/course/courseSlice';
import courseService from '../../features/course/courseService';
import { categoryApi } from '../../api/categoryApi';

// Hooks & Components
import { useAddCourseForm } from '../../features/course/useAddCourseForm';
import { validateCourse } from '../../features/course/courseValidation';
import Step1_CourseInfo from '../../components/instructor/Step1_CourseInfo';
import Step2_Media from '../../components/instructor/Step2_Media';
import Step3_Curriculum from '../../components/instructor/Step3_Curriculum';
import Step4_Details from '../../components/instructor/Step4_Details';
import Step5_Pricing from '../../components/instructor/Step5_Pricing';
import LessonModal from '../../components/instructor/LessonModal';
import CancelModal from '../../components/common/CancelModal';

const STEPS = [
    { label: 'Thông tin', icon: '1' },
    { label: 'Media', icon: '2' },
    { label: 'Nội dung', icon: '3' },
    { label: 'Chi tiết', icon: '4' },
    { label: 'Giá', icon: '5' },
];

const EditCoursePage = () => {
    const { slug } = useParams(); // Slug từ URL - dùng làm S3 key prefix
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading } = useSelector(state => state.course);

    const [currentStep, setCurrentStep] = useState(1);
    const [categoriesList, setCategoriesList] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    // Review message (nếu course bị changes_requested / rejected)
    const [reviewMessage, setReviewMessage] = useState(null);
    const [courseStatus, setCourseStatus] = useState(null); // changes_requested | rejected | draft | ...

    // Modal State
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [editingSectionIndex, setEditingSectionIndex] = useState(null);
    const [editingLectureIndex, setEditingLectureIndex] = useState(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    // ✅ Track steps có lỗi để hiển thị warning badge trên stepper
    const [errorSteps, setErrorSteps] = useState([]);
    // ✅ Track field-level errors để highlight từng field trong Step
    const [errorFields, setErrorFields] = useState({});

    // Use Custom Hook (giống AddCourse)
    const form = useAddCourseForm();

    useEffect(() => {
        if (location.state?.showEnterToast) {
            const timer = setTimeout(() => {
                toast('Đã vào trang chỉnh sửa khóa học');
                navigate(location.pathname, { replace: true, state: {} });
            }, 80);

            return () => clearTimeout(timer);
        }
    }, [location.state, location.pathname, navigate]);


    // ============================================================
    // LOAD DATA
    // ============================================================
    useEffect(() => {
        const initData = async () => {
            try {
                const [catRes, courseRes] = await Promise.all([
                    categoryApi.getAllCategoriesSimple(),
                    courseService.getInstructorCourseForEdit(slug)
                ]);

                const cats = catRes.data?.data || [];
                setCategoriesList(cats);

                const apiData = courseRes.data;

                // Lưu lại reviewMessage nếu có
                if (apiData.reviewMessage) setReviewMessage(apiData.reviewMessage);
                if (apiData.status) setCourseStatus(apiData.status);

                // Map categories
                const mappedCategories = (apiData.categories || []).map(catId => {
                    const id = typeof catId === 'object' ? catId._id : catId;
                    const found = cats.find(c => c._id === id);
                    return found
                        ? { value: found._id, label: found.name, isNew: false }
                        : { value: id, label: 'Unknown', isNew: false };
                });

                // Đổ dữ liệu vào form
                form.setFullData({ ...apiData, categories: mappedCategories });

            } catch (error) {
                console.error(error);
                toast.error('Không thể tải dữ liệu khóa học hoặc bạn không có quyền sửa.');
                navigate('/instructor/courses');
            } finally {
                setIsFetching(false);
            }
        };

        if (slug) initData();
    }, [slug, navigate]);

    // ============================================================
    // COURSE SLUG - KEY POINT
    // Ưu tiên: slug từ form (đã load từ API) → slug từ URL params
    // Edit mode luôn có slug sẵn (không cần generate mới như AddCourse)
    // ============================================================
    const courseSlug = form.courseData?.slug || slug || null;

    // ============================================================
    // SUBMIT HANDLER (AWS version - giống AddCourse nhưng có courseId/revisionId)
    // Tất cả media (thumbnail, preview, video lectures) đã upload lên S3 trước.
    // Ở đây chỉ pack CDN URLs vào FormData và gửi lên API.
    // ============================================================
    const handleProcessCourse = useCallback(async (actionType) => {
        const { courseData } = form;
        const isDraft = actionType === 'draft';

        // ✅ Centralized validation với auto-navigate-to-step
        const { isValid, errors, firstErrorStep, errorFields: validationErrorFields } = validateCourse(courseData, isDraft ? 'draft' : 'submit');
        if (!isValid) {
            setErrorSteps([...new Set(errors.map(e => e.step))]);
            setErrorFields(validationErrorFields);
            toast.error(
                <div className="space-y-1">
                    {errors.map((e, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                            <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{e.message}</span>
                        </div>
                    ))}
                </div>,
                { duration: 5000 }
            );
            if (firstErrorStep && firstErrorStep !== currentStep) {
                setCurrentStep(firstErrorStep);
            }
            // Auto-scroll đến field lỗi đầu tiên
            setTimeout(() => {
                const el = document.querySelector('.field-error, [class*="ring-red"]');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
            return;
        }
        setErrorSteps([]);
        setErrorFields({});

        const toastId = toast.loading(isDraft ? 'Đang lưu nháp...' : 'Đang gửi lên Admin...');

        try {
            const formData = new FormData();
            formData.append('title', courseData.title);

            // ✅ Key: Gửi slug để backend tìm đúng revision (quan trọng nhất)
            formData.append('slug', courseSlug || slug);

            // Nếu có courseId (edit course đã publish), gửi thêm
            if (courseData.courseId) {
                formData.append('courseId', courseData.courseId);
            }

            // Nếu có revisionId (edit revision cũ), gửi thêm
            if (courseData.revisionId) {
                formData.append('revisionId', courseData.revisionId);
            }

            // Basic info
            courseData.categories.forEach(cat => formData.append('categories', cat.value));
            formData.append('level', courseData.level || 'alllevels');
            formData.append('language', courseData.language || 'Vietnamese');
            formData.append('price', courseData.isFree ? 0 : (courseData.price || 0));
            formData.append('priceDiscount', courseData.isFree ? 0 : (courseData.priceDiscount || 0));
            formData.append('shortDescription', courseData.shortDescription || '');
            formData.append('description', courseData.description || '');

            // Thumbnail - ưu tiên CDN URL từ S3
            const thumbnailCDN = courseData.thumbnailUrl || courseData.thumbnail || '';
            formData.append('thumbnailUrl', thumbnailCDN);

            // Preview video CDN URL
            const previewCDN = courseData.previewUrl || courseData.previewVideoUrl || '';
            formData.append('previewUrl', previewCDN);

            // Status
            const statusToSend = isDraft ? (courseData.status === 'changes_requested' ? 'changes_requested' : 'draft') : 'pending';
            formData.append('status', statusToSend);

            // Array fields
            ['learnOutcomes', 'requirements', 'audience', 'includes'].forEach(field => {
                (courseData[field] || []).forEach(item => formData.append(field, item));
            });

            // Sections - tất cả videoUrl phải là CDN URLs (đã upload qua LessonModal)
            const sections = courseData.sections.map((sec, sIdx) => ({
                title: sec.title,
                order: sec.order ?? sIdx,
                lectures: (sec.lectures || []).map((lec, lIdx) => ({
                    title: lec.title,
                    videoUrl: lec.videoUrl || '',   // CDN URL từ S3
                    duration: lec.duration || 0,
                    order: lec.order ?? lIdx,
                    isPreviewFree: lec.isPreviewFree || false,
                    resources: (lec.resources || []).map(res => ({
                        title: res.title,
                        url: res.url || '',
                        type: res.type || 'link'
                    })),
                    // ✅ FIX: Đưa quizzes vào payload — trước đây bị bỏ sót
                    quizzes: (lec.quizzes || []).map(q => ({
                        question: q.question || '',
                        options: (q.options || []).map(o => ({ id: o.id, text: o.text || '' })),
                        correctAnswer: q.correctAnswer || 'A',
                        hint: q.hint || '',
                        timestamp: Number(q.timestamp) || 0,
                        isActive: q.isActive !== false, // default true
                    }))
                }))
            }));
            formData.append('sections', JSON.stringify(sections));


            // Dispatch
            const resultAction = await dispatch(createNewCourse(formData));

            if (createNewCourse.fulfilled.match(resultAction)) {
                toast.success(
                    isDraft ? '✅ Đã lưu nháp!' : '🎉 Đã gửi lên chờ Admin duyệt!',
                    { id: toastId, duration: 3000 }
                );
                navigate('/instructor/courses');
            } else {
                toast.error(resultAction.payload || 'Thất bại', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra.', { id: toastId });
        }
    }, [form, courseSlug, slug, dispatch, navigate]);

    const onSaveDraft = () => handleProcessCourse('draft');
    const onSubmit = () => handleProcessCourse('submit');
    const onCancel = () => setIsCancelModalOpen(true);

    const handleModalSaveDraft = () => {
        setIsCancelModalOpen(false);
        handleProcessCourse('draft');
    };
    const handleModalExit = () => {
        setIsCancelModalOpen(false);
        navigate('/instructor/courses');
    };

    // ============================================================
    // LESSON MODAL HANDLERS
    // ============================================================
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

    // ============================================================
    // RENDER STEPS
    // ============================================================
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
                        errorFields={errorFields}
                    />
                );
            case 2:
                return (
                    <Step2_Media
                        courseData={form.courseData}
                        setCourseData={form.setCourseData}
                        courseSlug={courseSlug}
                        errorFields={errorFields}
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
                        setCourseData={form.setCourseData}
                        errorFields={errorFields}
                    />
                );
            case 4:
                return (
                    <Step4_Details
                        courseData={form.courseData}
                        handleInputChange={form.handleInputChange}
                        handleArrayAction={form.handleArrayAction}
                        errorFields={errorFields}
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

    // ============================================================
    // LOADING STATE
    // ============================================================
    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
                <div className="w-12 h-12 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium">Đang tải dữ liệu khóa học...</p>
            </div>
        );
    }

    // ============================================================
    // STATUS BADGE CONFIG
    // ============================================================
    const statusConfig = {
        changes_requested: {
            label: '⚠️ Cần chỉnh sửa theo yêu cầu Admin',
            bg: 'bg-orange-50 border-orange-200',
            text: 'text-orange-800',
            badge: 'bg-orange-100 text-orange-700 border-orange-200'
        },
        rejected: {
            label: '❌ Khóa học bị từ chối',
            bg: 'bg-red-50 border-red-200',
            text: 'text-red-800',
            badge: 'bg-red-100 text-red-700 border-red-200'
        },
        draft: null,
    };
    const statusInfo = statusConfig[courseStatus];

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
            <div className="max-w-5xl mx-auto">

                {/* Page Header - đồng bộ với AddCourse */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                            <BookOpen size={20} className="text-rose-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa khóa học</h1>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                {form.courseData.title || slug}
                            </p>
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
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Lưu nháp
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={isLoading}
                            className="px-4 py-2 text-white bg-rose-600 border border-rose-600 rounded-xl hover:bg-rose-700 font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {courseStatus === 'changes_requested' ? 'Gửi lại duyệt' : 'Gửi duyệt'}
                        </button>
                    </div>
                </div>

                {/* Review Message Banner (Changes Requested / Rejected) */}
                {statusInfo && reviewMessage && (
                    <div className={`border rounded-2xl p-4 mb-6 ${statusInfo.bg}`}>
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className={`${statusInfo.text} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className={`font-bold text-sm ${statusInfo.text}`}>{statusInfo.label}</p>
                                    <span className={`px-2 py-0.5 text-xs rounded-full border font-semibold ${statusInfo.badge}`}>
                                        {courseStatus}
                                    </span>
                                </div>
                                <p className={`text-sm leading-relaxed ${statusInfo.text}`}>{reviewMessage}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Hãy chỉnh sửa theo yêu cầu trên, rồi nhấn <strong>"Gửi lại duyệt"</strong> để Admin xem xét lại.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stepper - đồng bộ với AddCourse (Rose theme) */}
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
                            const isDone = stepNum < currentStep;
                            const isActive = stepNum === currentStep;
                            const hasError = errorSteps.includes(stepNum);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentStep(stepNum)}
                                    className="flex flex-col items-center z-10 flex-1 group"
                                >
                                    <div className="relative">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all
                                            ${isActive ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 scale-110'
                                                : hasError ? 'bg-red-50 text-red-500 border-2 border-red-400'
                                                    : isDone ? 'bg-emerald-500 text-white'
                                                        : 'bg-gray-100 text-gray-400 group-hover:bg-rose-50 group-hover:text-rose-400'}`
                                        }>
                                            {isDone && !hasError ? <Check size={18} /> : hasError ? <AlertCircle size={16} /> : step.icon}
                                        </div>
                                        {hasError && !isActive && (
                                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                                        )}
                                    </div>
                                    <span className={`text-xs font-semibold uppercase tracking-wide transition-colors
                                        ${isActive ? 'text-rose-600' : hasError ? 'text-red-500' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {step.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[600px]">
                    {renderStepContent()}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                        {currentStep > 1 ? (
                            <button
                                onClick={prevStep}
                                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                                <ChevronLeft size={18} /> Trước
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 5 ? (
                            <button
                                onClick={nextStep}
                                className="px-6 py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 flex items-center gap-2 shadow-sm shadow-rose-200 transition-colors"
                            >
                                Tiếp theo <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={onSubmit}
                                disabled={isLoading}
                                className="px-8 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 flex items-center gap-2 shadow-sm shadow-rose-200 disabled:opacity-60 transition-colors"
                            >
                                {isLoading
                                    ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý...</>
                                    : <><Send size={18} /> {courseStatus === 'changes_requested' ? 'Gửi lại duyệt' : 'Gửi duyệt'}</>
                                }
                            </button>
                        )}
                    </div>
                </div>

                {/* Slug info badge (development helper) */}
                {courseSlug && (
                    <div className="mt-3 text-center">
                        <span className="text-xs text-gray-300">
                            S3 key prefix: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">{courseSlug}/</code>
                        </span>
                    </div>
                )}
            </div>

            {/* Lesson Modal - ✅ Pass courseSlug để S3 dùng đúng prefix */}
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
                    courseSlug={courseSlug} // ✅ FIX: Pass slug để upload S3 dùng đúng prefix
                />
            )}

            {/* Cancel Warning Modal */}
            <CancelModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onSaveDraft={handleModalSaveDraft}
                onExit={handleModalExit}
            />
        </div>
    );
};

export default EditCoursePage;